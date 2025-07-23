import puppeteer from "puppeteer";
import fs        from "fs";

const calendarUrl = "https://s2025.conference-schedule.org/";

//keep copy of old siggraph talkss
fs.rename("../data/siggraph_talks.json", "../data/siggraph_talks.old.json", (err) => {
  if (err) {
    console.warn(err);
  } else {
    "moved ../data/siggraph_talks.json to ../data/siggraph_talks.old.json"
  }
});

async function scrapePage(url) {
  console.log("loading " + url);
  const browser = await puppeteer.launch({ headless: true }); // Optional: headless is true by default
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' }); // wait for full load

  console.log("loaded page for " + url);
  console.log("loading page links");

  let {talks, presentations} = await page.evaluate(() => {
    let getElems = (className) => {
      return [...document.getElementsByClassName(className)]
    }

    let getElemsQs = (className, qs) => {
      return getElems(className).map(e => e.querySelector(qs)).filter(i => (i != null && i != undefined));
    }

    //avoid empty links and session pages
    let getLinks = elems => elems.filter(a => a?.getAttribute("data-link-type") !== "full-program_all.program.session").map(a => a.href).filter(s => s?.length > 0);

    //gather talk pages
    let talks = getLinks(getElemsQs("title-speakers-td", "a"));

    //gather presntations
    let presentations = getLinks(getElemsQs("presentation-title", "a"));

    return {talks, presentations};
  });

  //gather all of the talks
  let allTalks = [...talks, ...presentations];
  // allTalks = allTalks.slice(0, 10);
  // allTalks = ["https://s2025.conference-schedule.org/?post_type=page&p=14&id=gensub_294&sess=sess167"];
  let talkObjs = {
    talkUrls : allTalks,
    talks : [],
  };

  //lookup talks by url
  let urlTalkMap = {};

  console.log("loading talk pages");
  for (let talk of allTalks){
    try {
      console.log("loading " + talk);
      await page.goto(talk, {waitUntil: 'networkidle0'});
      let talkObj = await page.evaluate(() => {
        let talkObj = {};

        let getElems = (className, elem=document) => {
          if (!elem) return [];
          return [...elem.getElementsByClassName(className)]
        }

        //left bar
        talkObj.sessionName = getElems("session-title")[0]?.querySelector("a")?.textContent;
        talkObj.sessionUrl  = getElems("session-title")[0]?.querySelector("a")?.href;

        let titleElem       = getElems("presentation-title")[0];
        talkObj.title       = getElems("presentation-title")[0]?.textContent;
        talkObj.description  = getElems("abstract")[0]?.textContent;
        talkObj.presenters  = getElems("presenter-details").map(e => {
          let personObj = {};
          personObj.img  = e.querySelector("img")?.src;
          personObj.name = getElems("presenter-name", e)[0]?.querySelector("a")?.textContent;
          personObj.url  = getElems("presenter-name", e)[0]?.querySelector("a")?.href;
          personObj.institutions = getElems("presenter-institution", e).map(i => {
            let institutionObj  = {};
            institutionObj.name = i.querySelector("a")?.textContent;
            institutionObj.url  = i.querySelector("a")?.href;
            return institutionObj;
          });
          return personObj;
        })

        //right bar
        talkObj.img        = getElems("representative-img")[0]?.src;
        talkObj.events     = getElems("event-type-name", getElems("event-types")[0]).map(e => e?.textContent);
        talkObj.dateString = getElems("presentation-date")[0]?.textContent;
        talkObj.startTime  = getElems("start-time")[0]?.getAttribute("utc_time");
        talkObj.endTime    = getElems("end-time")[0]?.getAttribute("utc_time");
        talkObj.room       = getElems("room")[0]?.textContent;

        talkObj.interestAreas = getElems("program-track", getElems("interest-area")[0]).map(e => e?.textContent);
        talkObj.recordings    = getElems("program-track", getElems("recording")[0]).map(e => e?.textContent);
        talkObj.keywords      = getElems("program-track", getElems("keyword")[0]).map(e => e?.textContent);
        talkObj.registrations = getElems("program-track", getElems("registration-category")[0]).map(e => e?.textContent);

        talkObj.nextPresentation         = getElems("next-presentation-sect")[0]?.querySelector("a")?.href;
        talkObj.recommendedPresentations = getElems("recommended-presentation").map(e => e?.querySelector("a")?.href);

        return talkObj;
      });

      talkObj.url = talk;
      console.log(talkObj);
      talkObjs.talks.push(talkObj);
      urlTalkMap[talk] = talkObj;

    } catch (err) {
      console.warn(err);
      continue;
    }
  }

  for (let talkObj of talkObjs.talks){
    talkObj.recommendedPresentationsUrls = [...talkObj.recommendedPresentations];
    talkObj.nextPresentationUrl = talkObj.nextPresentation;
    talkObj.nextPresentation = urlTalkMap[talkObj.nextPresentation]?.title;
    talkObj.recommendedPresentations = talkObj.recommendedPresentations.map(t => urlTalkMap[t]?.title);
  }

  //write data to file
  fs.writeFile('../data/siggraph_talks.json', JSON.stringify(talkObjs, null, 2), err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('siggraph_talks.json was written successfully!');
    }
  })

  await page.close();
  await browser.close();

  // console.log(talks);
  // console.log(presentations);
  return;
}


await scrapePage(calendarUrl);