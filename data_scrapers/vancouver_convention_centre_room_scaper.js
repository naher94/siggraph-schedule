import fs from 'fs';

let urls=[
  "https://www.vancouverconventioncentre.com/map/west/west-base/spaces.json",
  "https://www.vancouverconventioncentre.com/map/west/west-exhibition/spaces.json",
  "https://www.vancouverconventioncentre.com/map/west/west-lv1/spaces.json",
  "https://www.vancouverconventioncentre.com/map/west/west-lv2/spaces.json",
  "https://www.vancouverconventioncentre.com/map/west/west-lv3/spaces.json",
  "https://www.vancouverconventioncentre.com/map/east/east-base/spaces.json",
  "https://www.vancouverconventioncentre.com/map/east/east-convention/spaces.json",
  "https://www.vancouverconventioncentre.com/map/east/east-meeting/spaces.json"
];
let roomNames = [];

async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    let ids = json["features"].map(e => e.id);
    roomNames.push.apply(roomNames, ids);
  } catch (error) {
    console.error(error.message);
  }
}

for (let url of urls) await getData(url);
console.log(roomNames);

const text = roomNames.join("\n");

//write the room names to a file
fs.writeFile('../data/vancouver_convention_centre_room_list.txt', text, err => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('vancouver_convention_centre_room_list.txt was written successfully!');
  }
})