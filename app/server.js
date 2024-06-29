var http = require('http');
var fs = require('fs');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser = require('body-parser');
var uid = require('rand-token').uid;
const url = require('url');

let brands = [];
let products = [];
let users = [];
let accessTokens = [];

const myRouter = Router();

const findUserAccessToken = () => {
	users.find((user) => {
		const validToken = accessTokens.find((token) => {
			return token == user.login.accessToken;
		});
		return validToken;
	});
};

const server = http
	.createServer(function (request, response) {
		myRouter(request, response, finalHandler(request, response));
	})
	.listen(8000, () => {
		fs.readFile(
			'./initial-data/brands.json',
			'utf8',
			function (error, data) {
				if (error) throw error;
				brands = JSON.parse(data);
			}
		);
		fs.readFile(
			'./initial-data/products.json',
			'utf8',
			function (error, data) {
				if (error) throw error;
				products = JSON.parse(data);
			}
		);
		fs.readFile(
			'./initial-data/users.json',
			'utf8',
			function (error, data) {
				if (error) throw error;
				users = JSON.parse(data);
			}
		);
	});

myRouter.get('/store/brands', (request, response) => {
	response.writeHead(200, 'Successful Request');
	return response.end(JSON.stringify(brands));
});

myRouter.get('/store/brands/:id/products', (request, response) => {
	const product = products.find((product) => {
		return product.id == request.params.id;
	});
	if (!product) {
		response.writeHead(404, 'Item not found');
		return response.end();
	}
	response.writeHead(200, 'Successful Request');
	return response.end(JSON.stringify(product));
});

myRouter.get('/store/products', (request, response) => {
	const query = request.query;

	if (products.length === 0) {
		response.writeHead(404, 'Inventory not found');
		return response.end();
	}
	if (query) {
		const filteredProducts = products.filter((product) =>
			product.name.toLowerCase().includes(query.toLowerCase())
		);
		response.writeHead(200, 'Successful Request');
		return response.end(JSON.stringify(filteredProducts));
	}
	response.writeHead(200, 'Successful Request');
	return response.end(JSON.stringify(products));
});

myRouter.post('store/login', (request, response) => {
	if (request.body.username && request.body.password) {
		let user = users.find((user) => {
			return (
				user.login.username == request.body.username &&
				user.login.password == request.body.password
			);
		});
		if (user) {
			let newToken = uid(16);
			user.login.accessToken = newToken;
			accessTokens.push(newToken);
			response.writeHead(200, 'You have succesfully logged in');
			response.end();
		} else {
			response, writeHead(400, 'Invalid username or password');
			response.end();
		}
	} else {
		response.writeHead(400, 'Unauthorized - Invalid Credentials Format');
		response.end();
	}
});

myRouter.get('me/cart', (request, response) => {
	const user = findUserAccessToken();

	if (user) {
		response.writeHead(200, 'Successful Request');
		response.end(JSON.stringify(user.cart));
	} else {
		response.writeHead(
			401,
			'Unauthorized - User not authenticated. Please sign in'
		);
		response.end();
	}
});

myRouter.post('/me/cart', (request, response) => {
	const user = findUserAccessToken();

	if (user) {
		const addedItem = products.find((item) => {
			return item.id == request.body.productId;
		});
		if (addedItem) {
			user.cart.push(addedItem);
			response.end(JSON.stringify(user.cart));
		} else {
			response.writeHead(404, 'Item not found');
			response.end();
		}
	} else {
		response.writeHead(401, 'User not authenticated. Please sign in');
		response.end();
	}
});

myRouter.delete('/me/cart/:productId', (request, response) => {
	const user = findUserAccessToken();

	if (!user) {
		response.writeHead(401, 'User not authenticated. Please sign in');
		response.end();
	}

	if (!user.cart) {
		user.cart = [];
	}

	const updateCart = user.cart.filter((item) => {
		return item.id !== request.params.productId;
	});
	response.writeHead(200, 'Item successfully removed from cart');
	response.end(JSON.stringify(updateCart));
});

myRouter.put('/me/cart/:productId', (request, response) => {
	const user = findUserAccessToken();

	if (!user) {
		response.writeHead(401, 'User not authenticated. Please sign in');
		response.end();
	}

	const quantity = request.body.quantity;
	const foundItem = products.find((item) => {
		return item.id == request.params.productId;
	});

	if (quantity < 1) {
		response.writehead(400, 'Quantity must be at least 1');
		response.end();
	}

	if (!foundItem) {
		response.writeHead(404, 'Item not found');
		response.end();
	}

	const cartItem = user.cart.find((item) => {
		return item.id == request.params.productId;
	});

	if (!cartItem) {
		response.writeHead(404, 'Item not in cart');
		response.end();
	}

	response.writeHead(200, 'Successful Request');
	response.end(JSON.stringify(user.cart));
});
module.exports = server;
