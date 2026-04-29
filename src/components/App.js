import React, { Component } from "react";
import * as Sentry from "@sentry/react";
import "./App.css";
import wrenchImg from "../assets/wrench.png";
import nailsImg from "../assets/nails.png";
import hammerImg from "../assets/hammer.png";

const monify = (n) => (n / 100).toFixed(2);
const getUniqueId = () => "_" + Math.random().toString(36).substring(2, 9);
const routes = {
  home: "/",
  pricingError: "/pricing-error",
  inventoryError: "/inventory-error",
  logTest: "/log-test",
};
const loremWords = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "labore",
  "magna",
  "aliqua",
];
const getRandomLogMessage = () => {
  const wordCount = 5 + Math.floor(Math.random() * 7);
  return Array.from({ length: wordCount }, () => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  }).join(" ");
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cart: [],
      lastLogMessage: "",
    };

    const params = new URLSearchParams(window.location.search);
    const sessionName =
      params.get("name") || Math.random().toString(36).substring(2, 6);
    this.user = {
      id: sessionName,
      username: sessionName,
    };
    this.currentRoute = window.location.pathname;

    this.store = [
      {
        id: "wrench",
        name: "Wrench",
        price: 500,
        img: wrenchImg,
      },
      {
        id: "nails",
        name: "Nails",
        price: 25,
        img: nailsImg,
      },
      {
        id: "hammer",
        name: "Hammer",
        price: 1000,
        img: hammerImg,
      },
    ];
    this.buyItem = this.buyItem.bind(this);
    this.checkout = this.checkout.bind(this);
    this.resetCart = this.resetCart.bind(this);
    this.triggerPricingError = this.triggerPricingError.bind(this);
    this.triggerInventoryError = this.triggerInventoryError.bind(this);
    this.sendTestLog = this.sendTestLog.bind(this);
  }

  componentDidMount() {
    const defaultError = window.onerror;
    window.onerror = (...args) => {
      this.setState({ hasError: true, success: false });
      if (defaultError) {
        return defaultError(...args);
      }
      return false;
    };

    // Add context to error/event
    // View this data in "Tags"
    Sentry.setUser(this.user); // attach user context
    Sentry.setTag("customerType", "medium-plan"); // custom-tag
    Sentry.setTag("session_name", this.user.username);
    Sentry.setTag("route", this.currentRoute);
  }

  buyItem(item) {
    const cart = [].concat(this.state.cart);
    cart.push(item);
    console.log(item);
    this.setState({ cart, success: false });

    // Add context to error/event
    // View this data in "Additional Data"
    // Sentry.configureScope((scope) => {
    //   scope.setExtra("cart", JSON.stringify(cart));
    // });
    // // View this data in "Breadcrumbs"
    // Sentry.addBreadcrumb({
    //   category: "cart",
    //   message: "User added " + item.name + " to cart",
    //   level: "info",
    // });
  }

  resetCart(event) {
    event.preventDefault();
    this.setState({ cart: [], hasError: false, success: false });

    // Reset context for error/event
    // Sentry.configureScope((scope) => {
    //   scope.setExtra("cart", "");
    // });
    // Sentry.addBreadcrumb({
    //   category: "cart",
    //   message: "User emptied cart",
    //   level: "info",
    // });
  }

  checkout() {
    // Generate an error
    this.myCodeIsMorePerfect();

    const order = {
      user: this.user.username,
      cart: this.state.cart,
    };

    // generate unique transactionId and set as Sentry tag
    const transactionId = getUniqueId();
    // Sentry.configureScope((scope) => {
    //   scope.setTag("transaction_id", transactionId);
    // });

    // Set transctionID as header
    const fetchData = {
      method: "POST",
      body: JSON.stringify(order),
      headers: new Headers({ "X-Transaction-ID": transactionId }),
    };

    /*
      POST request to /checkout endpoint.
        - Custom header with transactionId for transaction tracing
        - throw error if response !== 200
    */
    // fetch("http://localhost:8000/checkout", fetchData).then(
    //   (error, response) => {
    //     if (error) {
    //       throw error;
    //     }
    //     if (response.statusCode === 200) {
    //       this.setState({ success: true });
    //     } else {
    //       throw new Error(
    //         response.statusCode +
    //           " - " +
    //           (response.statusMessage || response.body)
    //       );
    //     }
    //   }
    // );
  }

  triggerPricingError() {
    throw new Error("PricingError: discount code lookup failed");
  }

  triggerInventoryError() {
    const item = undefined;
    item.quantityAvailable.toString();
  }

  sendTestLog() {
    const message = getRandomLogMessage();
    Sentry.logger.info(message, { log_source: "sentry_test" });
    this.setState({ lastLogMessage: message });
  }

  routeWithSession(route) {
    return `${route}${window.location.search}`;
  }

  renderNav() {
    return (
      <nav className="route-nav">
        <a href={this.routeWithSession(routes.home)}>Store</a>
        <a href={this.routeWithSession(routes.pricingError)}>Pricing error</a>
        <a href={this.routeWithSession(routes.inventoryError)}>
          Inventory error
        </a>
        <a href={this.routeWithSession(routes.logTest)}>Log test</a>
      </nav>
    );
  }

  renderErrorRoute({ title, description, buttonLabel, onClick }) {
    return (
      <div className="App">
        <main>
          <header>
            <h1>{title}</h1>
          </header>
          {this.renderNav()}
          <section className="demo-route">
            <p>{description}</p>
            <button onClick={onClick}>{buttonLabel}</button>
          </section>
        </main>
        {this.renderSidebar()}
      </div>
    );
  }

  renderLogRoute() {
    return (
      <div className="App">
        <main>
          <header>
            <h1>Log Test</h1>
          </header>
          {this.renderNav()}
          <section className="demo-route">
            <p>This route sends a random lorem ipsum string to Sentry logs.</p>
            <button onClick={this.sendTestLog}>Send test log</button>
            {this.state.lastLogMessage && (
              <p className="last-log-message">
                Last log: {this.state.lastLogMessage}
              </p>
            )}
          </section>
        </main>
        {this.renderSidebar()}
      </div>
    );
  }

  renderSidebar() {
    const total = this.state.cart.reduce((t, i) => t + i.price, 0);
    const cartDisplay = this.state.cart.reduce((c, { id }) => {
      c[id] = c[id] ? c[id] + 1 : 1;
      return c;
    }, {});

    return (
      <div className="sidebar">
        <header>
          <h4>Hi, {this.user.username}!</h4>
        </header>
        <div className="cart">
          {this.state.cart.length ? (
            <div>
              {Object.keys(cartDisplay).map((id) => {
                const { name, price } = this.store.find((i) => i.id === id);
                const qty = cartDisplay[id];
                return (
                  <div className="cart-item" key={id}>
                    <div className="cart-item-name">
                      {name} x{qty}
                    </div>
                    <div className="cart-item-price">${monify(price * qty)}</div>
                  </div>
                );
              })}
              <hr />
              <div className="cart-item">
                <div className="cart-item-name">
                  <strong>Total</strong>
                </div>
                <div className="cart-item-price">
                  <strong>${monify(total)}</strong>
                </div>
              </div>
            </div>
          ) : (
            "Your cart is empty"
          )}
        </div>
        {this.state.hasError && <p className="cart-error">Something went wrong</p>}
        {this.state.success && (
          <p className="cart-success">Thank you for your purchase!</p>
        )}
        <button onClick={this.checkout} disabled={this.state.cart.length === 0}>
          Checkout
        </button>{" "}
        {this.state.cart.length > 0 && (
          <button onClick={this.resetCart} className="cart-reset">
            Empty cart
          </button>
        )}
      </div>
    );
  }

  render() {
    if (this.currentRoute === routes.pricingError) {
      return this.renderErrorRoute({
        title: "Pricing Error Demo",
        description: "This route throws a custom pricing error.",
        buttonLabel: "Trigger pricing error",
        onClick: this.triggerPricingError,
      });
    }

    if (this.currentRoute === routes.inventoryError) {
      return this.renderErrorRoute({
        title: "Inventory Error Demo",
        description: "This route throws a JavaScript TypeError.",
        buttonLabel: "Trigger inventory error",
        onClick: this.triggerInventoryError,
      });
    }

    if (this.currentRoute === routes.logTest) {
      return this.renderLogRoute();
    }

    return (
      <div className="App">
        <main>
          <header>
            <h1>Online Hardware Store</h1>
          </header>
          {this.renderNav()}

          <div className="inventory">
            {this.store.map((item) => {
              const { name, id, img, price } = item;
              return (
                <div className="item" key={id}>
                  <div className="thumbnail">
                    <img src={img} alt="" />
                  </div>
                  <p>{name}</p>
                  <div className="button-wrapper">
                    <strong>${monify(price)}</strong>
                    <button onClick={() => this.buyItem(item)}>Buy!</button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        {this.renderSidebar()}
      </div>
    );
  }
}

export default App;
