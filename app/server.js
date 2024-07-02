var http = require('http');
var fs = require('fs');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser = require('body-parser');
var uid = require('rand-token').uid;
const url = require('url');

//set up variables to store data
let brands = [];
let products = [];
let users = [];
let accessTokens = ['test'];
//set up router
const myRouter = Router();
myRouter.use(bodyParser.json());

//helper function to authenticate user
const findUserAccessToken = (request) => {
	const reqToken = request.headers.authorization.substring(7);
	if (accessTokens.includes(reqToken)) {
		return users.find((user) => {
			return reqToken == user.login.accessToken;
		});
	} else {
		return null;
	}
};

//setting up server
const server = http
	.createServer(function (request, response) {
		myRouter(request, response, finalHandler(request, response));
	})
	.listen(8000, () => {
		//reads files then stores the data into appropriate variables
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

//request that gets all the store brands
myRouter.get('/store/brands', (request, response) => {
	response.writeHead(200, { 'Content-Type': 'application/json' });
	return response.end(JSON.stringify(brands));
});
//request that gets an product by id number
myRouter.get('/store/brands/:id/products', (request, response) => {
	const product = products.find((product) => {
		return product.id == request.params.id;
	});
	if (!product) {
		response.writeHead(404, 'Item not found');
		return response.end();
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	return response.end(JSON.stringify(product));
});

//gets all store products if no query or gets a filtered list based on query
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
		response.writeHead(200, { 'Content-Type': 'application/json' });
		return response.end(JSON.stringify(filteredProducts));
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	return response.end(JSON.stringify(products));
});

//logs in the user
myRouter.post('/login', (request, response) => {
	if (request.body.username && request.body.password) {
		//finds user by comparing enterered username and password with list of users
		let user = users.find((user) => {
			return (
				user.login.username == request.body.username &&
				user.login.password == request.body.password
			);
		});
		//if user logs in it assigns them an access token
		if (user) {
			let newToken = uid(16);
			user.login.accessToken = newToken;
			accessTokens.push(newToken);
			response.writeHead(200, { 'Content-Type': 'application/json' });
			return response.end(JSON.stringify(user.login.accessToken));
		} else {
			response.writeHead(401, 'Invalid username or password');
			return response.end();
		}
	} else {
		response.writeHead(400, 'Unauthorized - Invalid Credentials Format');
		return response.end();
	}
});
//retrieves the users cart
myRouter.get('/me/cart', (request, response) => {
	const user = findUserAccessToken(request);
	if (user) {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify(user.cart));
	} else {
		response.writeHead(
			401,
			'Unauthorized - User not authenticated. Please sign in'
		);
		response.end();
	}
});
//adds an item to the users cart based off of a product id sent in the request body
myRouter.post('/me/cart', (request, response) => {
	const user = findUserAccessToken(request);

	if (user) {
		const addedItem = products.find((item) => {
			return item.id == request.body.productId;
		});
		if (addedItem) {
			user.cart.push(addedItem);
			response.writeHead(200, { 'Content-Type': 'application/json' });
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

//deletes an item from the users cart based off a product id sent in the request params
myRouter.delete('/me/cart/:productId', (request, response) => {
	const user = findUserAccessToken(request);

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
	user.cart = updateCart;
	response.writeHead(200, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(user.cart));
});

//changes the quantity of the item in a cart based off of product id sent in the params and a quantity number sent in the users body
myRouter.put('/me/cart/:productId', (request, response) => {
	const user = findUserAccessToken(request);

	if (!user) {
		response.writeHead(401, 'User not authenticated. Please sign in');
		response.end();
	}

	const quantity = request.body.quantity;
	const foundItem = products.find((item) => {
		return item.id == request.params.productId;
	});

	if (quantity < 1) {
		response.writeHead(400, 'Quantity must be at least 1');
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
	} else {
		cartItem.quantity = quantity;
	}

	response.writeHead(200, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(user.cart));
});
module.exports = server;
