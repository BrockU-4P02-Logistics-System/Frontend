const {MongoClient} = require('mongodb');
const { MONGODB_URI } = process.env;

describe('insert', () => {
  let connection;
  let db;

  beforeEach(async () => {
     db.collection('test_users').deleteMany({});
  });

  beforeAll(async () => {
    connection = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
    });
    db = await connection.db('test_db');
  });

  afterAll(async () => {
    await connection.close();
    if(db.close) {
      await db.close();
    }
  });

  it('should insert a doc into collection', async () => {
    const users = db.collection('test_users');

    const mockUser = {_id: 'some-user-id', name: 'John'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({_id: 'some-user-id'});
    expect(insertedUser).toEqual(mockUser);
  });
});