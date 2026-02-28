package handler

import (
	"net/http"

	"backend/db"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateUserRequest はPOST /users のリクエストボディ
type CreateUserRequest struct {
	DisplayName string `json:"display_name" binding:"required"`
}

// CreateUser は POST /users のハンドラ
func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := uuid.New()

	_, err := db.Pool.Exec(c.Request.Context(), `
		INSERT INTO users (id, display_name) VALUES ($1, $2)
	`, userID, req.DisplayName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":           userID,
		"display_name": req.DisplayName,
	})
}

// GetUser は GET /users/:id のハンドラ
func GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	var displayName string
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT display_name FROM users WHERE id = $1
	`, id).Scan(&displayName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           id,
		"display_name": displayName,
	})
}
