package handler

import (
	"net/http"

	"backend/db"
	"backend/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListSessions は GET /sessions のハンドラ
// クエリパラメータ user_id で絞り込み可能
func ListSessions(c *gin.Context) {
	userIDStr := c.Query("user_id")

	var sessions []model.Session
	var err error

	if userIDStr != "" {
		userID, parseErr := uuid.Parse(userIDStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
			return
		}
		rows, queryErr := db.Pool.Query(c.Request.Context(), `
			SELECT s.id, s.criteria_key, s.title, s.description, s.start_at, s.end_at, s.status, s.created_at
			FROM sessions s
			JOIN session_participants sp ON s.id = sp.session_id
			WHERE sp.user_id = $1
			ORDER BY s.start_at ASC
		`, userID)
		if queryErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": queryErr.Error()})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var s model.Session
			if scanErr := rows.Scan(&s.ID, &s.CriteriaKey, &s.Title, &s.Description, &s.StartAt, &s.EndAt, &s.Status, &s.CreatedAt); scanErr != nil {
				continue
			}
			sessions = append(sessions, s)
		}
		err = rows.Err()
	} else {
		rows, queryErr := db.Pool.Query(c.Request.Context(), `
			SELECT id, criteria_key, title, description, start_at, end_at, status, created_at
			FROM sessions
			ORDER BY created_at DESC
			LIMIT 50
		`)
		if queryErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": queryErr.Error()})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var s model.Session
			if scanErr := rows.Scan(&s.ID, &s.CriteriaKey, &s.Title, &s.Description, &s.StartAt, &s.EndAt, &s.Status, &s.CreatedAt); scanErr != nil {
				continue
			}
			sessions = append(sessions, s)
		}
		err = rows.Err()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if sessions == nil {
		sessions = []model.Session{}
	}
	c.JSON(http.StatusOK, sessions)
}

// GetSession は GET /sessions/:id のハンドラ
func GetSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	var s model.Session
	s.ID = id
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT criteria_key, title, description, start_at, end_at, status, created_at
		FROM sessions WHERE id = $1
	`, id).Scan(&s.CriteriaKey, &s.Title, &s.Description, &s.StartAt, &s.EndAt, &s.Status, &s.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	// 参加者一覧をユーザー情報付きで取得
	rows, err := db.Pool.Query(c.Request.Context(), `
		SELECT u.id, u.display_name, u.bio, u.avatar_url, u.location, u.occupation, u.created_at
		FROM users u
		JOIN session_participants sp ON u.id = sp.user_id
		WHERE sp.session_id = $1
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var participants []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.DisplayName, &u.Bio, &u.AvatarURL, &u.Location, &u.Occupation, &u.CreatedAt); err != nil {
			continue
		}
		participants = append(participants, u)
	}

	if participants == nil {
		participants = []model.User{}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           s.ID,
		"criteria_key": s.CriteriaKey,
		"title":        s.Title,
		"description":  s.Description,
		"start_at":     s.StartAt,
		"end_at":       s.EndAt,
		"status":       s.Status,
		"created_at":   s.CreatedAt,
		"participants": participants,
	})
}
