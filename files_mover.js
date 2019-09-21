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

// process file
const processFiles = (inputDir, outputDir, threadN) => {
  if (!fs.existsSync(inputDir)) throw new Error("Can't find input directory");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  let buckets = distributeFiles(readFilesStat(inputDir), threadN);

  buckets.forEach((buck, ind) => {
    if (!fs.existsSync(outputDir + "/" + ind))
      fs.mkdirSync(outputDir + "/" + ind);

    console.log(`starting ${ind} bucket`);

    buck.files.forEach((fileEx) => {
      //console.log(`copying ${fileEx}`);
      fs.copyFile(inputDir + fileEx, outputDir + `${ind}/` + fileEx, (err) => {
        if (err) throw err;
        console.log(`copied ${fileEx}`);
      });
    });
  });
};

console.log(`start directory ${inputDirPath}`);

processFiles(inputDirPath, outputDirPath, threadNum);

console.log("end");
