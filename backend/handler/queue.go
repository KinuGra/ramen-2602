package handler

import (
	"net/http"

	"backend/db"
	"backend/matcher"
	"backend/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Enqueue は POST /queues のハンドラ
func Enqueue(c *gin.Context) {
	var req model.EnqueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := uuid.Parse(req.UserID)
	queueID := uuid.New()

	_, err := db.Pool.Exec(c.Request.Context(), `
		INSERT INTO queues (id, user_id, criteria_key, duration_min, status)
		VALUES ($1, $2, $3, $4, 'waiting')
	`, queueID, userID, req.CriteriaKey, req.DurationMin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sessionID, err := matcher.TryMatch(c.Request.Context(), req.CriteriaKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := gin.H{
		"queue_id": queueID,
		"status":   "waiting",
	}
	if sessionID != nil {
		resp["status"] = "matched"
		resp["session_id"] = sessionID
	}
	c.JSON(http.StatusCreated, resp)
}

// GetQueueStatus は GET /queues/:id のハンドラ
func GetQueueStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	var q model.Queue
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT id, user_id, criteria_key, duration_min, status, session_id, created_at
		FROM queues WHERE id = $1
	`, id).Scan(&q.ID, &q.UserID, &q.CriteriaKey, &q.DurationMin, &q.Status, &q.SessionID, &q.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "queue not found"})
		return
	}

	c.JSON(http.StatusOK, q)
}

// CancelQueue は DELETE /queues/:id のハンドラ
func CancelQueue(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	tag, err := db.Pool.Exec(c.Request.Context(), `
		UPDATE queues SET status = 'canceled'
		WHERE id = $1 AND status = 'waiting'
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "queue not found or already matched"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "canceled"})
}
