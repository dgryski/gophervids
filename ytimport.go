// +build ignore

// Command ytimport creates a partial JSON file from a list of youtube videos.
/*
To extract a list of IDs from a playlist:
   curl -s https://www.youtube.com/playlist?list=PLiAILMXD9huEKtg1Lyx0PO6Ki1WaJSyR5 |grep -o 'data-video-id="[^"]*"'  |sed 's/.*=//; s/"//g;' |go run ytimport.go >playlist.json
*/
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type video struct {
	Id          string
	PublishedAt time.Time
	Title       string
}

type Response struct {
	Items []struct {
		ID      string `json:"id"`
		Snippet struct {
			Publishedat time.Time `json:"publishedAt"`
			Title       string    `json:"title"`
		} `json:"snippet"`
	} `json:"items"`
}

func fetchInfo(vid string) (video, error) {

	url := fmt.Sprintf("https://www.googleapis.com/youtube/v3/videos?id=%s&key=%s&part=snippet", vid, apikey)

	r, err := http.Get(url)

	if err != nil {
		return video{}, err
	}
	defer r.Body.Close()

	var ytjson Response

	body, _ := ioutil.ReadAll(r.Body)

	err = json.Unmarshal(body, &ytjson)

	if err != nil {
		return video{}, err
	}

	return video{
		Id:          ytjson.Items[0].ID,
		PublishedAt: ytjson.Items[0].Snippet.Publishedat,
		Title:       ytjson.Items[0].Snippet.Title,
	}, nil
}

var apikey string

func main() {

	key, err := ioutil.ReadFile("apikey.txt")
	if err != nil {
		log.Fatalf("no api key found: ", err)
	}

	apikey = strings.TrimSpace(string(key))

	scanner := bufio.NewScanner(os.Stdin)

	var videos []video

	for scanner.Scan() {
		vid := scanner.Text()

		log.Println(vid)
		v, err := fetchInfo(vid)

		if err != nil {
			log.Println(err)
			continue
		}
		videos = append(videos, v)
	}

	if err := scanner.Err(); err != nil {
		log.Fatal("error during scan: ", err)
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
},`, v.PublishedAt.Format("2006-01-02"), today, v.Id, v.Title)
	}

}
