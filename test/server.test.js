const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server'); // Adjust the path as needed
const fs = require('fs');
const should = chai.should();
chai.use(chaiHttp);

// TODO: Write tests for the server

describe('Store', () => {
	describe('/store/brands', () => {
		it('should return an array of all the brands', (done) => {
			chai.request(server)
				.get('/store/brands')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('array');
					done();
				});
		});
	});

	describe('/store/brands/:id/products', () => {
		it('should get a item based off of Id', (done) => {
			let id = 1;
			chai.request(server)
				.get(`/store/brands/${id}/products`)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					done();
				});
		});
		it('should not get a product with an invalid id', (done) => {
			let id = 10000;
			chai.request(server)
				.get(`/store/brands/${id}/products`)
				.end((err, res) => {
					res.should.have.status(404);
					done();
				});
		});
		describe('/store/products', () => {
			it('should get all products when no query is added', (done) => {
				chai.request(server)
					.get('/store/products')
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.an('array');
						done();
					});
			});
		});
	});
});

describe('/login', () => {
	it('should log in the user', (done) => {
		chai.request(server)
			.post('/login')
			.send({
				username: 'lazywolf342',
				password: 'tucker',
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.be.a('string');
				res.body.length.should.be.equal(16);
				done();
			});
	});
	it('should return a 400 Invalid username or password', (done) => {
		chai.request(server)
			.post('/login')
			.send({
				username: 'laolf342',
				password: 'tucr',
			})
			.end((err, res) => {
				res.should.have.status(401);
				done();
			});
	});
	it('should return a 400 error if either field is empty or not formatted correctly', (done) => {
		chai.request(server)
			.post('/login')
			.send({
				username: 'laolf342',
				password: '',
			})
			.end((err, res) => {
				res.should.have.status(400);
				done();
			});
	});
});

describe('User', () => {
	describe('/GET /me/cart', () => {
		it('should return the users cart', (done) => {
			chai.request(server)
				.get('/me/cart')
				.set('authorization', 'Bearer test')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('array');
					done();
				});
		});
		it('should return a 401 error when user isnt logged in', (done) => {
			chai.request(server)
				.get('/me/cart')
				.set('authorization', 'Bearer badtest')
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});
	describe('/POST /me/cart', () => {
		it('should add new item to users cart', (done) => {
			chai.request(server)
				.post('/me/cart')
				.set('authorization', 'Bearer test')
				.send({ productId: '3' })
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('array');
					res.body.should.have.length(3);
					done();
				});
		});
		it('should give a 404 if item does not exist', (done) => {
			chai.request(server)
				.post('/me/cart')
				.set('authorization', 'Bearer test')
				.send({ productId: '99999' })
				.end((err, res) => {
					res.should.have.status(404);
					done();
				});
		});
		it('should give a 401 if user not logged in', (done) => {
			chai.request(server)
				.post('/me/cart')
				.set('authorization', 'Bearer badtest')
				.send({ productId: '1' })
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});
	describe('/DELETE /me/cart/{productId}', () => {
		it('should remove an item from users cart', (done) => {
			const productId = 1;

			chai.request(server)
				.delete(`/me/cart/${productId}`)
				.set('authorization', 'Bearer test')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('array');
					res.body.should.have.length(2);
					done();
				});
		});
		it('should give a 401 if not logged in', (done) => {
			const productId = 1;

			chai.request(server)
				.delete(`/me/cart/${productId}`)
				.set('authorization', 'Bearer badtest')
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});
	describe('/PUT /me/cart/{productId}', () => {
		it('should update quantity of item in cart', (done) => {
			const quantity = '10';
			const productId = 2;

			chai.request(server)
				.put(`/me/cart/${productId}`)
				.set('authorization', 'Bearer test')
				.send({ quantity: quantity })
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('array');
					res.body.should.deep.include({ id: '2', quantity: '10' });
					done();
				});
		});
		it('should return 401 if user not logged in', (done) => {
			const quantity = '10';
			const productId = 2;
			chai.request(server)
				.put(`/me/cart/${productId}`)
				.set('authorization', 'Bearer badtest')
				.send({ quantity: quantity })
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
		it('should return 400 if quantity is less then 1', (done) => {
			const quantity = '0';
			const productId = 2;
			chai.request(server)
				.put(`/me/cart/${productId}`)
				.set('authorization', 'Bearer test')
				.send({ quantity: quantity })
				.end((err, res) => {
					res.should.have.status(400);
					done();
				});
		});
		it('should return 404 if item does not exist', (done) => {
			const quantity = '10';
			const productId = 99999;
			chai.request(server)
				.put(`/me/cart/${productId}`)
				.set('authorization', 'Bearer test')
				.send({ quantity: quantity })
				.end((err, res) => {
					res.should.have.status(404);
					done();
				});
		});
		it('should return 404 status if item is not in cart', (done) => {
			const quantity = '10';
			const productId = 5;
			chai.request(server)
				.put(`/me/cart/${productId}`)
				.set('authorization', 'Bearer test')
				.send({ quantity: quantity })
				.end((err, res) => {
					res.should.have.status(404);
					done();
				});
		});
	});
});
