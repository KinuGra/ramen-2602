package handler

import (
	"net/http"
	"time"

	"backend/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetSession は GET /sessions/:id のハンドラ
func GetSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	// セッション情報を取得
	var (
		criteriaKey            string
		startAt, endAt, createdAt time.Time
		status                 string
	)
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT criteria_key, start_at, end_at, status, created_at
		FROM sessions WHERE id = $1
	`, id).Scan(&criteriaKey, &startAt, &endAt, &status, &createdAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	// 参加者一覧を取得
	rows, err := db.Pool.Query(c.Request.Context(), `
		SELECT user_id FROM session_participants WHERE session_id = $1
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var participants []uuid.UUID
	for rows.Next() {
		var uid uuid.UUID
		rows.Scan(&uid)
		participants = append(participants, uid)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           id,
		"criteria_key": criteriaKey,
		"start_at":     startAt,
		"end_at":       endAt,
		"status":       status,
		"participants": participants,
	})
}
