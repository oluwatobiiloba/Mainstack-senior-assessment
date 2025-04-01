import request from 'supertest';
import { app } from '../../src/app';
import { Role } from '../../src/interfaces/role.interface';
import { User } from '../../src/models/user.model';
import { Wallet } from '../../src/models/wallets.model';
import { UserAccount } from '../../src/models/user-account.model';
import { Transaction } from '../../src/models/transaction.model';
import { v4 } from 'uuid';

let authToken;

describe('Banking Routes Integration Tests', () => {

  let userToken: string = "";
  let userId: string = ""

  beforeAll(async () => {
    // Register User
    const userRegisterationResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: "user@test.com",
        password: "password",
        firstName: "User",
        lastName: "Test",
      });

    userId =  userRegisterationResponse.body.id

  
  });


  afterAll(async () => {
    await User.deleteMany({
      _id: { $in: [userId] }
    })

    await Wallet.deleteMany({
      user: { $in: [userId] }
    })

    await UserAccount.deleteMany({
      user: { $in: [userId] }
    })

    await Transaction.deleteMany({
      user: { $in: [userId] }
    })
  });


  describe('POST /api/v1/banking/deposit', () => {

    it('should deposit successfully with valid details', async () => {
        const userLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "user@test.com",
          password: "password"
        });
    
      const token = userLoginResponse.body.token;

      const account = await UserAccount.findOne({
        user: userLoginResponse.body.account.id
      })

      if(account){
        const res = await request(app)
        .post('/api/v1/banking/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          "amount": 100,
          "currency": "USD",
          "sourceAccountNumber": "1234567890",
          "transactionRef": v4(),
          "sourceBank": "MainStack",
          "destinationAcctNumber": account && account.accountNumber
        });

        console.log(res.body)
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      }
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/banking/deposit')
        .send({ amount: 100, currency: 'USD' });
      expect(res.status).toBe(401);
    });

    it('should fail with invalid parameters', async () => {
      const userLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "user@test.com",
          password: "password"
        });
    
      const token = userLoginResponse.body.token;
      const res = await request(app)
        .post('/api/v1/banking/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 'invalid', currency: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/banking/withdraw', () => {

    it('should withdraw successfully with correct PIN', async () => {

      const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "user@test.com",
        password: "password"
      });
  
      const token = userLoginResponse.body.token;

      const res = await request(app)
        .post('/api/v1/banking/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50, currency: 'USD', pin: '1234' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });


    it('should fail if unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/banking/withdraw')
        .send({ amount: 50, currency: 'USD', pin: '1234' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/banking/transfer', () => {
    it('should transfer funds successfully (internal transfer)', async () => {
      
      const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "user@test.com",
        password: "password"
      });
  
      const token = userLoginResponse.body.token;
      const res = await request(app)
        .post('/api/v1/banking/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 25, currency: 'USD', toAccount: 'testuser2' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail for external transfer without proper authorization', async () => {
      const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: "user@test.com",
        password: "password"
      });
  
      const token = userLoginResponse.body.token;
      const res = await request(app)
        .post('/api/v1/banking/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 25, currency: 'USD', toAccount: 'externalBank123', external: true });
      expect(res.status).toBe(403);
    });

    it('should fail if unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/banking/transfer')
        .send({ amount: 25, currency: 'USD', toAccount: 'testuser2' });
      expect(res.status).toBe(401);
    });
  });
});
