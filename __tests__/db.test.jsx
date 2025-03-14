const {MongoClient} = require('mongodb');
const { MONGODB_URI } = process.env;

describe('insert', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
    });
    db = await connection.db('test_db');
    db.collection('test_users').deleteMany({});

  });

  afterAll(async () => {
    await connection.close();
    if(db.close) {
      await db.close();
    }
  });

  it('Insert User following Schema', async () => {
    const users = db.collection('test_users');

    const mockUser = {username: 'test', email: 'fake@mail', password: 'hash_pw'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({email: 'fake@mail'});
    expect(insertedUser).toEqual(mockUser);
  });

  it('Delete User following Schema', async () => {

    const users = db.collection('test_users');

    const mockUser = {username: 'test', email: 'fake@mail', password: 'hash_pw'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOneAndDelete({email: 'fake@mail'});
    expect(insertedUser.email).toEqual('fake@mail');
  });

});