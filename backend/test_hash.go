package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	err := bcrypt.CompareHashAndPassword([]byte("$2a$10$EZtoJqI/Nu6BjxBJl82HB.y1ynlBlL7XLxeeWDqPu8Qh0Zn6jgUn6"), []byte("Admin123"))
	fmt.Println("Hash check for Admin123:", err)
}
