package handler

import (
	"net/http"

	"backend/db"
	"backend/model"

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

	c.JSON(http.StatusCreated, model.User{
		ID:          userID,
		DisplayName: req.DisplayName,
	})
}

// GetUser は GET /users/:id のハンドラ
func GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	var u model.User
	u.ID = id
	err = db.Pool.QueryRow(c.Request.Context(), `
		SELECT display_name, bio, avatar_url, location, occupation, created_at
		FROM users WHERE id = $1
	`, id).Scan(&u.DisplayName, &u.Bio, &u.AvatarURL, &u.Location, &u.Occupation, &u.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, u)
}

// UpdateUser は PUT /users/:id のハンドラ
func UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid uuid"})
		return
	}

	var req model.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var u model.User
	u.ID = id
	err = db.Pool.QueryRow(c.Request.Context(), `
		UPDATE users
		SET display_name = CASE WHEN $2 != '' THEN $2 ELSE display_name END,
		    bio          = CASE WHEN $3 != '' THEN $3 ELSE bio END,
		    avatar_url   = CASE WHEN $4 != '' THEN $4 ELSE avatar_url END,
		    location     = CASE WHEN $5 != '' THEN $5 ELSE location END,
		    occupation   = CASE WHEN $6 != '' THEN $6 ELSE occupation END
		WHERE id = $1
		RETURNING display_name, bio, avatar_url, location, occupation, created_at
	`, id, req.DisplayName, req.Bio, req.AvatarURL, req.Location, req.Occupation).
		Scan(&u.DisplayName, &u.Bio, &u.AvatarURL, &u.Location, &u.Occupation, &u.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, u)
}
