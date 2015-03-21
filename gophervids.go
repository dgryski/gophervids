package gophervids

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/feeds"
)

type vid struct {
	Date     string
	Added    string
	Id       string
	Tags     []string
	Speakers []string
	Title    string
}

func init() {

	js, _ := ioutil.ReadFile("static/vids.json")

	var vids []vid

	json.Unmarshal(js, &vids)

	feed := &feeds.Feed{
		Title:       "gophervids",
		Link:        &feeds.Link{Href: "http://gophervids.appspot.com"},
		Description: "categorized golang videos",
		Author:      &feeds.Author{"Damian Gryski", "damian@gryski.com"},
	}

	for _, v := range vids {
		created, _ := time.Parse("2006-01-02", v.Date)
		updated, _ := time.Parse("2006-01-02", v.Added)
		speaker := strings.Join(v.Speakers, ", ")
		feed.Items = append(feed.Items, &feeds.Item{
			Title:   v.Title,
			Link:    &feeds.Link{Href: "https://youtu.be/" + v.Id},
			Author:  &feeds.Author{speaker, ""},
			Created: created,
			Updated: updated,
		})
	}

	feed.Created = feed.Items[0].Updated

	http.HandleFunc("/rss.xml", func(w http.ResponseWriter, r *http.Request) {
		feed.WriteRss(w)
	})

	http.HandleFunc("/atom.xml", func(w http.ResponseWriter, r *http.Request) {
		feed.WriteAtom(w)
	})
}
