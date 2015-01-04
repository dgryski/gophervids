// +build ignore

// Command ytimport creates a partial JSON file from a list of youtube videos.
/*
To extract a list of IDs from a playlist:
   curl -s https://www.youtube.com/playlist?list=PLiAILMXD9huEKtg1Lyx0PO6Ki1WaJSyR5 |grep -o 'data-video-id="[^"]*"'  |sed 's/.*=//; s/"//g;' |go run ytimport.go
*/
package main

import (
	"bufio"
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type VideoXML struct {
	Id        string    `json:"id"`
	Title     string    `xml:"title" json:"title"`
	Published time.Time `xml:"published" json:"data"`
}

func fetchXML(vid string) (VideoXML, error) {

	url := fmt.Sprintf("https://gdata.youtube.com/feeds/api/videos/%s?v=2", vid)

	r, err := http.Get(url)

	if err != nil {
		return VideoXML{}, err
	}
	defer r.Body.Close()

	var vxml VideoXML

	err = xml.NewDecoder(r.Body).Decode(&vxml)

	if err != nil {
		return VideoXML{}, err
	}

	vxml.Id = vid

	return vxml, nil
}

func main() {

	scanner := bufio.NewScanner(os.Stdin)

	var videos []VideoXML

	for scanner.Scan() {
		vid := scanner.Text()

		v, err := fetchXML(vid)

		if err != nil {
			log.Println(err)
			continue
		}
		videos = append(videos, v)
	}

	today := time.Now().Format("2006-01-02")

	for _, v := range videos {
		fmt.Printf(`
{
   "date": "%s",
   "added": "%s",
   "id": "%s",
   "speakers": [],
   "tags": [],
   "title": %q
},`, v.Published.Format("2006-01-02"), today, v.Id, v.Title)
	}

}
