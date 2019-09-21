const fs = require("fs");

// module params /

const inputDirPath = "./samples/";
const outputDirPath = "./output/";
const threadNum = 4;

// reads files and their size from input dir
const readFilesStat = (inputDir) => {
  let filesExt = []; //resulting array
  try {
    if (fs.existsSync(inputDir)) {
      let files = fs.readdirSync(inputDir);
      console.log(`found ${files.length} files`);
      files.forEach((el) => {
        //console.log(`adding file: ${el}`);
        // new element in res array
        filesExt.push({
          filename: el,
          filesize: fs.statSync(inputDir + el).size
        });
      });
      //sorting resulting array
      filesExt.sort((a, b) => (a.filesize < b.filesize ? 1 : -1));
      console.log("sorted files");
      console.log(filesExt);
    } else {
      console.log(`no such directory`);
    }
  } catch (err) {
    console.error(err);
  }
  return filesExt;
};

// distributes the files accross buckets
const distributeFiles = (ordFiles, threadN) => {
  let bucketArr = [];
  // initiating buckets;
  for (let i = 0; i < threadN; i += 1)
    bucketArr.push({ bucketSize: 0, files: [] });

  console.log(`Created ${bucketArr.length} buckets`);
  console.log(bucketArr);

  //find a bucket for a specific file
  const getBucketNum = (fileO) => {
    //console.log(`defining bucket ${fileO.filename}`);
    let res, min;
    for (let i = 0; i < bucketArr.length; i += 1) {
      //console.log(`i=${i} res=${res} min=${min}`);
      if (min == undefined || min > bucketArr[i].bucketSize) {
        min = bucketArr[i].bucketSize;
        res = i;
      }
    }
    //console.log(`bucket = ` + res);
    return res;
  };

  // let's find a bucket for each file name
  ordFiles.forEach((fileObj, ind) => {
    let buckNum = getBucketNum(fileObj);
    //let buckNum;
    // console.log(`fileObj ${ind} -> bucket ${buckNum}`);
    bucketArr[buckNum].bucketSize += fileObj.filesize;
    bucketArr[buckNum].files.push(fileObj.filename);
    //    console.log("buckets");
    //    console.log(bucketArr);
  });
  console.log("destributed files");
  console.log(bucketArr);

  return bucketArr;
};

// processes files
const processFiles = (inputDir, outputDir, threadN) => {
  // essential checks
  if (!fs.existsSync(inputDir)) throw new Error("Can't find input directory");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // get buckets array
  let buckets = distributeFiles(readFilesStat(inputDir), threadN);

  buckets.forEach((buck, ind) => {
    buck.writeStream = fs.createWriteStream(`${outputDir}/${ind}.txt`);

    console.log(`starting ${ind} bucket`);

    buck.writeStream.on("ready", () => {
      let fileCount = 0;
      buck.files.forEach((fileEl) => {
        let str = fs.createReadStream(inputDir + fileEl);

        str.on("data", (data) => {
          buck.writeStream.write(data);
        });

        str.on("end", () => {
          //console.log(`${fileEl} file's copied `);
          ++fileCount;
          if (fileCount == buck.files.length) {
            buck.writeStream.end();
            console.log(`Bucket ${ind} done`);
          }
        });
      });
    });
  });
};

console.log(`processing directory ${inputDirPath}`);

processFiles(inputDirPath, outputDirPath, threadNum);

console.log("end");
