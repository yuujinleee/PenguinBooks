import fs from "fs";
const getInfo2 = async () => {
  let localJsonStatus = "";
  const res = await fetch(
    "https://api.penguinrandomhouse.com/resources/v2/title/domains/PRH.US/titles/9780525640370?api_key=qyv6q7cvn9sgyyv2zeh94bhj"
  );
  const resJson = await res.json();
  console.log(resJson.data);
  fs.writeFile("./data.json", JSON.stringify(resJson), (err) => {
    if (err) {
      localJsonStatus = "error occured";
      throw new Error(err);
    }
    console.log("job done");
    localJsonStatus = "Job done";
  });
  return { resJson, localJsonStatus };
};
export { getInfo2 as getPenguin };

// ------------------------------------------------------------

// import fs from "fs";
// // API
// async function getPenguins() {
//   //async because the data recieved is asynchronous
//   //mean all data is not recieved at the same time
//   try {
//     const response = await fetch(
//       "https://api.penguinrandomhouse.com/resources/v2/title/domains/PRH.US/titles/9780525640370?api_key=qyv6q7cvn9sgyyv2zeh94bhj"
//     );
//     //that why await is very important , it makes sure that you have all your data process before continuing
//     const responseData = await response.json();
//     //json() well you guess it parsing to json

//     console.log(responseData.data);

//     fs.writeFile("./eventdata.json", JSON.stringify(responseData), (err) => {
//       if (err) {
//         throw new Error(err);
//       }
//       console.log("job done");
//     });

//     return responseData.data;
//     //here the .data is generic you need to check the data structure of your response
//     //for example if you check here https://developer.penguinrandomhouse.com/docs/read/enhanced_prh_api/concepts/Images
//     //it should be something like responseData.promoImages
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// // getPenguins();
