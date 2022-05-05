import { Search, SentimentDissatisfied } from "@mui/icons-material";
import {
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";
import "./Products.css";
import ProductCard from "./ProductCard";
import Cart from "./Cart";
import { generateCartItemsFrom } from "./Cart";
// Definition of Data Structures used
/**
 * @typedef {Object} Product - Data on product available to buy
 *
 * @property {string} name - The name or title of the product


/**
 * @typedef {Object} CartItem -  - Data on product added to cart
 * 
 * @property {string} name - The name or title of the product in cart
 * @property {string} qty - The quantity of product added to cart
 * @property {string} category - The category that the product belongs to
 * @property {number} cost - The price to buy the product
 * @property {number} rating - The aggregate rating of the product (integer out of five)
 * @property {string} image - Contains URL for the product image
 * @property {string} _id - Unique ID for the product
 */

const Products = () => {
  var [hasHiddenAuthButtons, setHasHiddenAuthButtons] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    if (window.location.href[window.location.href.length - 1] === "/") {
      hasHiddenAuthButtons = true;
    }
  });
  // TODO: CRIO_TASK_MODULE_PRODUCTS - Fetch products data and store it
  /**
   * Make API call to get the products list and store it to display the products
   *
   * @returns { Array.<Product> }
   */
  const [products, setProducts] = useState([]);
  const performAPICall = async () => {
    const url = `${config.endpoint}/products`;
    try {
      const res = await axios.get(url);
      // console.log(res)
      await setProducts(res.data);
    } catch (e) {
      console.log("error");
    }
  };
  useState(async () => {
    await performAPICall();
  }, []);
  // TODO: CRIO_TASK_MODULE_PRODUCTS - Implement search logic
  /**
   * Definition for search handler
   * This is the function that is called on adding new search keys
   *
   * @param {string} text
   *    Text user types in the search bar. To filter the displayed products based on this text.
   *
   * @returns { Array.<Product> }
   *      Array of objects with complete data on filtered set of products
   *
   * API endpoint - "GET /products/search?value=<search-query>"
   *
   */
  const performSearch = async (text) => {
    if (text.length === 0) {
      performAPICall();
    } else {
      const url = `${config.endpoint}/products/search?value=${text}`;
      try {
        const res = await axios.get(url);
        await setProducts(res.data);
      } catch (e) {
        setProducts([-1]);
      }
    }
    // console.log(res)
  };

  // TODO: CRIO_TASK_MODULE_PRODUCTS - Optimise API calls with debounce search implementation
  /**
   * Definition for debounce handler
   * With debounce, this is the function to be called whenever the user types text in the searchbar field
   *
   * @param {{ target: { value: string } }} event
   *    JS event object emitted from the search input field
   *
   * @param {NodeJS.Timeout} debounceTimeout
   *    Timer id set for the previous debounce call
   *
   */
  // const debounceSearch = (event, debounceTimeout=500) => {
  //   // event()
  // };
  const [text, setText] = useState("");
  // const [deb,setDeb] = useState(text)
  let [timeout, setTimeoutFn] = useState(0);
  useEffect(() => {
    if (timeout !== 0) {
      clearTimeout(timeout);
    }
    const newTimeout = setTimeout(() => {
      performSearch(text);
    }, 500);
    setTimeoutFn(newTimeout);
  }, [text]);

  const debounceSearch = (event, debounceTimeout) => {};

  /**
   * Perform the API call to fetch the user's cart and return the response
   *
   * @param {string} token - Authentication token returned on login
   *
   * @returns { Array.<{ productId: string, qty: number }> | null }
   *    The response JSON object
   *
   * Example for successful response from backend:
   * HTTP 200
   * [
   *      {
   *          "productId": "KCRwjF7lN97HnEaY",
   *          "qty": 3
   *      },
   *      {
   *          "productId": "BW0jAAeDJmlZCF8i",
   *          "qty": 1
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 401
   * {
   *      "success": false,
   *      "message": "Protected route, Oauth2 Bearer token not found"
   * }
   */
  const [tempProd, setTempProd] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const fetchCart = async (token) => {
    if (!token) return;
    const url = `${config.endpoint}/cart`;

    try {
      // TODO: CRIO_TASK_MODULE_CART - Pass Bearer token inside "Authorization" header to get data from "GET /cart" API and return the response data
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("res",res.data)
      setTempProd(products);
      const data = await generateCartItemsFrom(res.data, products);
      setCartItems(data)
    } catch (e) {
      if (e.response && e.response.status === 400) {
        enqueueSnackbar(e.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar(
          "Could not fetch cart details. Check that the backend is running, reachable and returns valid JSON.",
          {
            variant: "error",
          }
        );
      }
      return null;
    }
  };
  useEffect(async () => {
    await fetchCart(localStorage.getItem("token"));
    //  console.log(products)
  }, [products]);
  // TODO: CRIO_TASK_MODULE_CART - Return if a product already exists in the cart
  /**
   * Return if a product already is present in the cart
   *
   * @param { Array.<{ productId: String, quantity: Number }> } items
   *    Array of objects with productId and quantity of products in cart
   * @param { String } productId
   *    Id of a product to be checked
   *
   * @returns { Boolean }
   *    Whether a product of given "productId" exists in the "items" array
   *
   */
  const isItemInCart = (items, productId) => {
    // console.log("items", items, productId);
    for (let i = 0; i < items.length; i++) {
      if (items[i]._id == productId) {
        return true;
      }
    }
    return false;
  };

  /**
   * Perform the API call to add or update items in the user's cart and update local cart data to display the latest cart
   *
   * @param {string} token
   *    Authentication token returned on login
   * @param { Array.<{ productId: String, quantity: Number }> } items
   *    Array of objects with productId and quantity of products in cart
   * @param { Array.<Product> } products
   *    Array of objects with complete data on all available products
   * @param {string} productId
   *    ID of the product that is to be added or updated in cart
   * @param {number} qty
   *    How many of the product should be in the cart
   * @param {boolean} options
   *    If this function was triggered from the product card's "Add to Cart" button
   *
   * Example for successful response from backend:
   * HTTP 200 - Updated list of cart items
   * [
   *      {
   *          "productId": "KCRwjF7lN97HnEaY",
   *          "qty": 3
   *      },
   *      {
   *          "productId": "BW0jAAeDJmlZCF8i",
   *          "qty": 1
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 404 - On invalid productId
   * {
   *      "success": false,
   *      "message": "Product doesn't exist"
   * }
   */
  const addToCart = async (
    token,
    items,
    products,
    productId,
    qty,
    options = { preventDuplicate: false }
  ) => {
    // console.log(
    //   "addtocart",
    //   isItemInCart(cartItems, productId),
    //   token,
    //   items,
    //   products,
    //   productId,
    //   qty,
    //   (options = { preventDuplicate: false })
    // );
    if (products.length > 0) {
      for (var i in products) {
        if (products[i]._id == productId) {
          products[i].qty = qty;
          const url = `${config.endpoint}/cart`;

          try {
            const res = await axios.post(
              url,
              { productId: productId, qty: qty },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "content-type": "application/json",
                },
              }
            );
            const data = await generateCartItemsFrom([...res.data], tempProd);
            setCartItems(data)
            console.log("addtocart", res.data,cartItems);
          } catch (e) {
            if (e.response && e.response.status === 400) {
              enqueueSnackbar(e.response.data.message, { variant: "error" });
            } else {
              enqueueSnackbar(
                "Could not fetch cart details. Check that the backend is running, reachable and returns valid JSON.",
                {
                  variant: "error",
                }
              );
            }
            return null;
          }
        }
      }
     const data =  await generateCartItemsFrom(cartItems, products);
     setCartItems(data)
    } else if (!isItemInCart(cartItems, productId)) {
      const url = `${config.endpoint}/cart`;

      try {
        // TODO: CRIO_TASK_MODULE_CART - Pass Bearer token inside "Authorization" header to get data from "GET /cart" API and return the response data
        const res = await axios.post(
          url,
          { productId: productId, qty: qty },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "content-type": "application/json",
            },
          }
        );
        const data = await generateCartItemsFrom([...res.data], tempProd);
        setCartItems(data)
        console.log(
          "from add to cart",
          [...res.data],
          cartItems,
          tempProd,
          setCartItems
        );
      } catch (e) {
        if (e.response && e.response.status === 400) {
          enqueueSnackbar(e.response.data.message, { variant: "error" });
        } else {
          enqueueSnackbar(
            "Could not fetch cart details. Check that the backend is running, reachable and returns valid JSON.",
            {
              variant: "error",
            }
          );
        }
        return null;
      }
    } else {
      enqueueSnackbar(
        "Item already in cart. Use the cart sidebar to update quantity or remove item.",
        { variant: "warning" }
      );
    }
  };

  return (
    <div>
      <Header
        hasHiddenAuthButtons={hasHiddenAuthButtons}
        children={true}
        setText={setText}
        // performSearch={performSearch}
        // debounceSearch={debounceSearch}
      ></Header>
      <Grid container spacing={2}>
        <Grid item sm={12} md={localStorage.getItem("username") ? 9 : 12}>
          {/* Search view for mobiles */}
          <TextField
            className="search-mobile"
            onChange={(e) => {
              setText(e.target.value);
            }}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search color="primary" />
                </InputAdornment>
              ),
            }}
            placeholder="search for items/categories"
            name="search"
          />
          <Grid container>
            <Grid item className="product-grid">
              <Box className="hero">
                <p className="hero-heading">
                  India’s{" "}
                  <span className="hero-highlight">FASTEST DELIVERY</span> to
                  your door step
                </p>
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {products[0] === -1 ? (
              <div className="loading">
                <SentimentDissatisfied />
                <p>no products found</p>
              </div>
            ) : products.length === 0 ? (
              <div className="loading">
                <CircularProgress />
                <p>Loading Data...</p>
              </div>
            ) : (
              products.map((product) => {
                return (
                  <ProductCard
                    product={product}
                    key={product._id}
                    handleAddToCart={addToCart}
                  />
                );
              })
            )}
          </Grid>
        </Grid>
        {localStorage.getItem("username") ? (
          <Grid
            item
            xs={12}
            sm={12}
            md={3}
            style={{ marginTop: "1rem", backgroundColor: "#E9F5E1" }}
          >
            <Cart
              items={cartItems}
              products={products}
              handleQuantity={addToCart}
            />
          </Grid>
        ) : (
          <></>
        )}
      </Grid>

      <Footer />
    </div>
  );
};

export default Products;
