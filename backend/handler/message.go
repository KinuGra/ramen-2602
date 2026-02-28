package handler

import (
	"net/http"

	"backend/db"
	"backend/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetMessages は GET /sessions/:id/messages のハンドラ
func GetMessages(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	rows, err := db.Pool.Query(c.Request.Context(), `
		SELECT m.id, m.session_id, m.sender_id, u.display_name, u.avatar_url, m.text, m.created_at
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.session_id = $1
		ORDER BY m.created_at ASC
	`, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var msg model.Message
		if err := rows.Scan(&msg.ID, &msg.SessionID, &msg.SenderID, &msg.SenderName, &msg.SenderAvatar, &msg.Text, &msg.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, msg)
	}

	if messages == nil {
		messages = []model.Message{}
	}
	c.JSON(http.StatusOK, messages)
}

// SendMessage は POST /sessions/:id/messages のハンドラ
func SendMessage(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req model.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	senderID, _ := uuid.Parse(req.SenderID)
	msgID := uuid.New()

	_, err = db.Pool.Exec(c.Request.Context(), `
		INSERT INTO messages (id, session_id, sender_id, text)
		VALUES ($1, $2, $3, $4)
	`, msgID, sessionID, senderID, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 作成したメッセージをユーザー情報付きで返す
	var msg model.Message
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT m.id, m.session_id, m.sender_id, u.display_name, u.avatar_url, m.text, m.created_at
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.id = $1
	`, msgID).Scan(&msg.ID, &msg.SessionID, &msg.SenderID, &msg.SenderName, &msg.SenderAvatar, &msg.Text, &msg.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, msg)
}
