package main

import (
	"log"
	"net/http"

	"backend/db"
	"backend/handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := db.Init(); err != nil {
		log.Fatalf("DB接続に失敗しました: %v", err)
	}
	log.Println("✅ DB接続成功")

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Users
	r.POST("/users", handler.CreateUser)
	r.GET("/users/:id", handler.GetUser)
	r.PUT("/users/:id", handler.UpdateUser)

	// Queues
	r.POST("/queues", handler.Enqueue)
	r.GET("/queues/:id", handler.GetQueueStatus)
	r.DELETE("/queues/:id", handler.CancelQueue)

	// Sessions
	r.GET("/sessions", handler.ListSessions)
	r.GET("/sessions/:id", handler.GetSession)

	// Messages
	r.GET("/sessions/:id/messages", handler.GetMessages)
	r.POST("/sessions/:id/messages", handler.SendMessage)

	log.Println("🚀 サーバー起動: http://localhost:8080")
	_ = r.Run("0.0.0.0:8080")
}
