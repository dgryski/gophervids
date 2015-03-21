package main

import (
	"log"
	"net/http"

	"github.com/influx6/webgrid"
)

func main() {

	static := webgrid.NewStaticServo(".", "")

	err := http.ListenAndServe(":3000", static)

	if err != nil {
		log.Fatal("Error Listening at port 3000")
	}

}
