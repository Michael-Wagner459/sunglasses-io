const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server'); // Adjust the path as needed

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
					});
			});
		});
	});
});

describe('Login', () => {});

describe('Cart', () => {});
