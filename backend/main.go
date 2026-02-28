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
	// 1. DB接続
	if err := db.Init(); err != nil {
		log.Fatalf("DB接続に失敗しました: %v", err)
	}
	log.Println("✅ DB接続成功")

	// 2. Ginルーター作成
	r := gin.Default()

	// 3. CORS設定（Next.jsからのリクエストを許可）
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	// 4. ルート定義
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	r.POST("/users", handler.CreateUser)
	r.GET("/users/:id", handler.GetUser)
	r.POST("/queues", handler.Enqueue)        // マッチング待ちに参加
	r.DELETE("/queues/:id", handler.CancelQueue) // キャンセル
	r.GET("/sessions/:id", handler.GetSession)  // セッション詳細

	// 5. サーバー起動
	log.Println("🚀 サーバー起動: http://localhost:8080")
	_ = r.Run("0.0.0.0:8080")
}
