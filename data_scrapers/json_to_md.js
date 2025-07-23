import fs from 'fs';

let slugify = str => {
  // 1. Trim leading/trailing whitespace
  return str.trim()
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-').replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
}

let utcToDateString = utc => {
    const utcDate = new Date(utc);

    // Create a DateTimeFormat that always uses Pacific Time
    const pacificFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZoneName: 'shortOffset', // Provides offset like GMT-7
    });

    // Use formatToParts to extract individual components
    const partsArray = pacificFormatter.formatToParts(utcDate);
    const parts = Object.fromEntries(partsArray.map(p => [p.type, p.value]));

    // Extract the components we care about
    const yyyy = parts.year;
    const mm = parts.month;
    const dd = parts.day;
    const hh = parts.hour;
    const min = parts.minute;

    // Final formatted string
    // -0700 instead of -0800 for pacific time without DLS
    const formatted = `${yyyy}-${mm}-${dd} ${hh}:${min} -0700`;

    return formatted;
}

fs.readFile("../data/siggraph_talks.json", (err, data) => {
    if (err){
        console.error(err);
        return;
    }

    let talks = JSON.parse(data).talks.slice(0, 10);

    //TODO need to map the urls of similar presentations onto actual presenations

    for (let talk of talks){
        let md = 
`---
layout: presentation
name: "${talk.title}"
event-type: ${talk.events[0].toLowerCase()}
location: ${talk.room}
start-time: ${utcToDateString(talk.startTime)}
end-time: ${utcToDateString(talk.endTime)}
contributors: ${"[" + talk.presenters.map(p => slugify(p.name)).join(", ") + "]"}
part-of-session: "no"
similar-presentations:
---

${talk.description}
`;

        fs.writeFile(`../_presentations/${slugify(talk.title)}.md`, md, err => {
            if (err) console.warn(err);
            else console.log("wrote " + `../_presentations/${slugify(talk.title)}.md`);
        });
    }
})