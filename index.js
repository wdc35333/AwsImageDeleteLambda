const { DeleteObjectsCommand, S3Client } = require("@aws-sdk/client-s3");

const transformationOptions = [
  { name: "w32", width: 32 },
  { name: "w140", width: 140 },
  { name: "w280", width: 280 },
  { name: "w640", width: 640 },
];

const client = new S3Client({});

exports.handler = async (event) => {
  try {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;
    console.log(`리사이징 이미지 제거 시작: ${Key}`);
    
    const Objects = transformationOptions.map(({ name }) => {
      const deleteKey = `${Key}_${name}`;
      const s3obj = { Bucket, Key: deleteKey };
      return s3obj;
    });

    // Create a DeleteObjectsCommand for deleting objects
    const dupVerification = Key.split('_')[Key.split('_').length - 1];
    if (['w32', 'w140', 'w280', 'w640'].some(option => dupVerification.includes(option))) {
      console.log('이미 제거된 파일');
      return {
         statusCode: 400,
         body: event,
      }
   }
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: Bucket,
      Delete: {
        Objects: Objects.map((s3obj) => ({ Key: s3obj.Key })),
      },
    });

    const { Deleted } = await client.send(deleteCommand);
    console.log(
      `Successfully deleted ${Deleted.length} objects from S3 bucket. Deleted objects:`
    );
    console.log(Deleted.map((d) => ` • ${d.Key}`).join("\n"));

    return {
      statusCode: 200,
      body: event,
    };
  } catch (err) {
    console.log(`error: ${err}`);
    return {
      statusCode: 500,
      body: event,
    };
  }
};
