// +build ignore

package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"sort"
	"time"
)

type video struct {
	Id       string   `json:"id"`
	Date     date     `json:"date"`
	Added    date     `json:"added"`
	Title    string   `json:"title"`
	Speakers []string `json:"speakers"`
	Tags     []string `json:"tags"`
}

type date time.Time

func (d *date) UnmarshalJSON(b []byte) error {
	t, err := time.Parse(`"2006-01-02"`, string(b))
	*d = date(t)
	return err
}

func (d date) MarshalJSON() ([]byte, error) {
	b := (time.Time)(d).Format(`"2006-01-02"`)
	return []byte(b), nil
}

func (d date) Before(t date) bool {
	return (time.Time)(d).Before(time.Time(t))
}

type videos []video

func (v videos) Len() int { return len(v) }

func (v videos) Less(i int, j int) bool {
	return v[i].Date.Before(v[j].Date)
}

func (v videos) Swap(i int, j int) {
	v[i], v[j] = v[j], v[i]
}

func main() {

	vs, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		log.Fatalf("unable to read stdin: %v", err)
	}

	var vids videos

	err = json.Unmarshal(vs, &vids)
	if err != nil {
		log.Fatalf("unable to unmarshal: %v", err)
	}

	sort.Sort(sort.Reverse(vids))

	b, err := json.MarshalIndent(vids, "", "    ")
	if err != nil {
		log.Fatalf("unable to marshal: %v", err)
	}

	fmt.Print(string(b), "\n")
}
