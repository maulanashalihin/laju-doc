---
title: E-commerce Example
---

# E-commerce Example

A full-featured online store with product catalog, shopping cart, checkout flow, and payment integration. This example demonstrates complex state management and third-party integrations.

## Features

- ✅ **Product Catalog** - Categories, filters, search, and pagination
- ✅ **Shopping Cart** - Session and database persistence
- ✅ **Checkout Flow** - Multi-step checkout with validation
- ✅ **Payment Integration** - Stripe and Midtrans support
- ✅ **Order Management** - Track orders with status updates
- ✅ **Inventory Management** - Stock tracking and low stock alerts
- ✅ **Discount System** - Coupons and promotional codes
- ✅ **Wishlist** - Save items for later
- ✅ **Reviews & Ratings** - Customer product reviews
- ✅ **Admin Dashboard** - Manage products, orders, and customers

## Database Schema

### Migrations

Create `migrations/20250130000002_create_ecommerce_tables.ts`:

```typescript
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Categories
  await db.schema
    .createTable("categories")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("description", "text")
    .addColumn("image", "text")
    .addColumn("parent_id", "text")
    .addColumn("created_at", "integer")
    .execute();

  // Products
  await db.schema
    .createTable("products")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("description", "text")
    .addColumn("price", "integer", (col) => col.notNull()) // in cents
    .addColumn("compare_price", "integer")
    .addColumn("cost_price", "integer")
    .addColumn("sku", "text", (col) => col.notNull().unique())
    .addColumn("stock", "integer", (col) => col.defaultTo(0))
    .addColumn("track_inventory", "integer", (col) => col.defaultTo(1))
    .addColumn("category_id", "text", (col) => col.references("categories.id"))
    .addColumn("images", "text") // JSON array
    .addColumn("status", "text", (col) => col.defaultTo("active"))
    .addColumn("weight", "integer") // in grams
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Cart Items
  await db.schema
    .createTable("cart_items")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("user_id", "text", (col) => col.references("users.id").onDelete("cascade"))
    .addColumn("session_id", "text")
    .addColumn("product_id", "text", (col) => col.references("products.id"))
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("created_at", "integer")
    .execute();

  // Orders
  await db.schema
    .createTable("orders")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("order_number", "text", (col) => col.notNull().unique())
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("status", "text", (col) => col.defaultTo("pending"))
    .addColumn("payment_status", "text", (col) => col.defaultTo("pending"))
    .addColumn("payment_method", "text")
    .addColumn("subtotal", "integer", (col) => col.notNull())
    .addColumn("discount", "integer", (col) => col.defaultTo(0))
    .addColumn("shipping", "integer", (col) => col.defaultTo(0))
    .addColumn("tax", "integer", (col) => col.defaultTo(0))
    .addColumn("total", "integer", (col) => col.notNull())
    .addColumn("currency", "text", (col) => col.defaultTo("USD"))
    .addColumn("notes", "text")
    .addColumn("created_at", "integer")
    .addColumn("updated_at", "integer")
    .execute();

  // Order Items
  await db.schema
    .createTable("order_items")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("order_id", "text", (col) => col.references("orders.id").onDelete("cascade"))
    .addColumn("product_id", "text", (col) => col.references("products.id"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("price", "integer", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .execute();

  // Coupons
  await db.schema
    .createTable("coupons")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("code", "text", (col) => col.notNull().unique())
    .addColumn("type", "text", (col) => col.notNull()) // percentage, fixed
    .addColumn("value", "integer", (col) => col.notNull())
    .addColumn("min_order", "integer")
    .addColumn("max_discount", "integer")
    .addColumn("usage_limit", "integer")
    .addColumn("usage_count", "integer", (col) => col.defaultTo(0))
    .addColumn("starts_at", "integer")
    .addColumn("expires_at", "integer")
    .addColumn("active", "integer", (col) => col.defaultTo(1))
    .execute();

  // Reviews
  await db.schema
    .createTable("reviews")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("product_id", "text", (col) => col.references("products.id").onDelete("cascade"))
    .addColumn("user_id", "text", (col) => col.references("users.id"))
    .addColumn("rating", "integer", (col) => col.notNull())
    .addColumn("title", "text")
    .addColumn("content", "text")
    .addColumn("verified", "integer", (col) => col.defaultTo(0))
    .addColumn("created_at", "integer")
    .execute();

  // Indexes
  await db.schema
    .createIndex("products_category_idx")
    .on("products")
    .column("category_id")
    .execute();

  await db.schema
    .createIndex("products_status_idx")
    .on("products")
    .column("status")
    .execute();

  await db.schema
    .createIndex("cart_user_idx")
    .on("cart_items")
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("order_user_idx")
    .on("orders")
    .column("user_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("reviews").execute();
  await db.schema.dropTable("coupons").execute();
  await db.schema.dropTable("order_items").execute();
  await db.schema.dropTable("orders").execute();
  await db.schema.dropTable("cart_items").execute();
  await db.schema.dropTable("products").execute();
  await db.schema.dropTable("categories").execute();
}
```

### Type Definitions

Add to `type/db-types.ts`:

```typescript
export interface CategoryTable {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  created_at: number;
}

export interface ProductTable {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku: string;
  stock: number;
  track_inventory: number;
  category_id: string | null;
  images: string | null; // JSON
  status: "active" | "draft" | "archived";
  weight: number | null;
  created_at: number;
  updated_at: number;
}

export interface CartItemTable {
  id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  quantity: number;
  created_at: number;
}

export interface OrderTable {
  id: string;
  order_number: string;
  user_id: string | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderItemTable {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CouponTable {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: number | null;
  expires_at: number | null;
  active: number;
}

export interface ReviewTable {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  verified: number;
  created_at: number;
}

// Update DB interface
export interface DB {
  users: UserTable;
  sessions: SessionTable;
  categories: CategoryTable;
  products: ProductTable;
  cart_items: CartItemTable;
  orders: OrderTable;
  order_items: OrderItemTable;
  coupons: CouponTable;
  reviews: ReviewTable;
  // ... other tables
}
```

## Controllers

### ProductController

Create `app/controllers/shop/ProductController.ts`:

```typescript
import { Request, Response } from "../../../type";
import DB from "../../services/DB";

class ProductController {
  // List products with filters
  public async index(request: Request, response: Response) {
    const page = parseInt(request.query.page || "1");
    const category = request.query.category;
    const search = request.query.search;
    const minPrice = request.query.min_price ? parseInt(request.query.min_price) : null;
    const maxPrice = request.query.max_price ? parseInt(request.query.max_price) : null;
    const sort = request.query.sort || "newest";
    const perPage = 12;
    const offset = (page - 1) * perPage;

    let query = DB.selectFrom("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .select([
        "products.id",
        "products.name",
        "products.slug",
        "products.description",
        "products.price",
        "products.compare_price",
        "products.images",
        "products.stock",
        "products.status",
        "categories.name as category_name",
        "categories.slug as category_slug"
      ])
      .where("products.status", "=", "active");

    if (category) {
      query = query.where("categories.slug", "=", category);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb("products.name", "like", `%${search}%`),
          eb("products.description", "like", `%${search}%`)
        ])
      );
    }

    if (minPrice !== null) {
      query = query.where("products.price", ">=", minPrice * 100);
    }

    if (maxPrice !== null) {
      query = query.where("products.price", "<=", maxPrice * 100);
    }

    // Sorting
    switch (sort) {
      case "price_low":
        query = query.orderBy("products.price", "asc");
        break;
      case "price_high":
        query = query.orderBy("products.price", "desc");
        break;
      case "name":
        query = query.orderBy("products.name", "asc");
        break;
      default: // newest
        query = query.orderBy("products.created_at", "desc");
    }

    const [products, totalResult] = await Promise.all([
      query.limit(perPage).offset(offset).execute(),
      DB.selectFrom("products")
        .select(eb => eb.fn.countAll().as('count'))
        .where("status", "=", "active")
        .executeTakeFirst()
    ]);

    // Get categories for sidebar
    const categories = await DB.selectFrom("categories")
      .select(["id", "name", "slug"])
      .orderBy("name")
      .execute();

    return response.inertia("shop/index", {
      products: products.map(p => ({
        ...p,
        price: p.price / 100,
        compare_price: p.compare_price ? p.compare_price / 100 : null
      })),
      categories,
      pagination: {
        page,
        perPage,
        total: Number(totalResult?.count || 0),
        totalPages: Math.ceil(Number(totalResult?.count || 0) / perPage)
      },
      filters: { category, search, minPrice, maxPrice, sort }
    });
  }

  // Show single product
  public async show(request: Request, response: Response) {
    const { slug } = request.params;

    const product = await DB.selectFrom("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .select([
        "products.*",
        "categories.name as category_name"
      ])
      .where("products.slug", "=", slug)
      .where("products.status", "=", "active")
      .executeTakeFirst();

    if (!product) {
      return response.status(404).inertia("errors/404");
    }

    // Get reviews
    const reviews = await DB.selectFrom("reviews")
      .innerJoin("users", "reviews.user_id", "users.id")
      .select([
        "reviews.id",
        "reviews.rating",
        "reviews.title",
        "reviews.content",
        "reviews.verified",
        "reviews.created_at",
        "users.name as user_name"
      ])
      .where("reviews.product_id", "=", product.id)
      .orderBy("reviews.created_at", "desc")
      .limit(10)
      .execute();

    // Get related products
    const related = await DB.selectFrom("products")
      .select(["id", "name", "slug", "price", "images"])
      .where("category_id", "=", product.category_id)
      .where("id", "!=", product.id)
      .where("status", "=", "active")
      .limit(4)
      .execute();

    return response.inertia("shop/product", {
      product: {
        ...product,
        price: product.price / 100,
        compare_price: product.compare_price ? product.compare_price / 100 : null,
        images: JSON.parse(product.images || "[]")
      },
      reviews,
      related: related.map(r => ({
        ...r,
        price: r.price / 100,
        images: JSON.parse(r.images || "[]")
      }))
    });
  }
}

export default new ProductController();
```

### CartController

Create `app/controllers/shop/CartController.ts`:

```typescript
import { Request, Response } from "../../../type";
import DB from "../../services/DB";
import { randomUUID } from "crypto";

class CartController {
  // Get or create cart
  private async getCart(userId: string | null, sessionId: string) {
    const cartItems = await DB.selectFrom("cart_items")
      .innerJoin("products", "cart_items.product_id", "products.id")
      .select([
        "cart_items.id as cart_id",
        "cart_items.quantity",
        "products.id",
        "products.name",
        "products.slug",
        "products.price",
        "products.images",
        "products.stock",
        "products.status"
      ])
      .where(userId ? "cart_items.user_id" : "cart_items.session_id", "=", userId || sessionId)
      .where("products.status", "=", "active")
      .execute();

    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return {
      items: cartItems.map(item => ({
        ...item,
        price: item.price / 100,
        image: JSON.parse(item.images || "[]")[0] || null
      })),
      total: total / 100,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  // Get cart
  public async index(request: Request, response: Response) {
    const sessionId = request.session.id || randomUUID();
    const cart = await this.getCart(request.user?.id || null, sessionId);

    return response.inertia("shop/cart", { cart });
  }

  // Add to cart
  public async add(request: Request, response: Response) {
    const { product_id, quantity = 1 } = await request.json();
    const userId = request.user?.id;
    const sessionId = request.session.id || randomUUID();

    // Check product
    const product = await DB.selectFrom("products")
      .select(["id", "stock", "status"])
      .where("id", "=", product_id)
      .executeTakeFirst();

    if (!product || product.status !== "active") {
      return response.status(404).json({ error: "Product not found" });
    }

    if (product.stock < quantity) {
      return response.status(400).json({ error: "Insufficient stock" });
    }

    // Check existing cart item
    const existing = await DB.selectFrom("cart_items")
      .select(["id", "quantity"])
      .where("product_id", "=", product_id)
      .where(userId ? "user_id" : "session_id", "=", userId || sessionId)
      .executeTakeFirst();

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.stock) {
        return response.status(400).json({ error: "Insufficient stock" });
      }

      await DB.updateTable("cart_items")
        .set({ quantity: newQuantity })
        .where("id", "=", existing.id)
        .execute();
    } else {
      await DB.insertInto("cart_items")
        .values({
          id: randomUUID(),
          user_id: userId || null,
          session_id: userId ? null : sessionId,
          product_id,
          quantity,
          created_at: Date.now()
        })
        .execute();
    }

    const cart = await this.getCart(userId || null, sessionId);
    return response.json({ success: true, cart });
  }

  // Update quantity
  public async update(request: Request, response: Response) {
    const { id } = request.params;
    const { quantity } = await request.json();
    const userId = request.user?.id;
    const sessionId = request.session.id;

    const cartItem = await DB.selectFrom("cart_items")
      .select(["id", "product_id"])
      .where("id", "=", id)
      .where(userId ? "user_id" : "session_id", "=", userId || sessionId)
      .executeTakeFirst();

    if (!cartItem) {
      return response.status(404).json({ error: "Item not found" });
    }

    if (quantity <= 0) {
      await DB.deleteFrom("cart_items").where("id", "=", id).execute();
    } else {
      // Check stock
      const product = await DB.selectFrom("products")
        .select("stock")
        .where("id", "=", cartItem.product_id)
        .executeTakeFirst();

      if (product && quantity > product.stock) {
        return response.status(400).json({ error: "Insufficient stock" });
      }

      await DB.updateTable("cart_items")
        .set({ quantity })
        .where("id", "=", id)
        .execute();
    }

    const cart = await this.getCart(userId || null, sessionId);
    return response.json({ success: true, cart });
  }

  // Remove from cart
  public async remove(request: Request, response: Response) {
    const { id } = request.params;
    const userId = request.user?.id;
    const sessionId = request.session.id;

    await DB.deleteFrom("cart_items")
      .where("id", "=", id)
      .where(userId ? "user_id" : "session_id", "=", userId || sessionId)
      .execute();

    const cart = await this.getCart(userId || null, sessionId);
    return response.json({ success: true, cart });
  }

  // Clear cart
  public async clear(request: Request, response: Response) {
    const userId = request.user?.id;
    const sessionId = request.session.id;

    await DB.deleteFrom("cart_items")
      .where(userId ? "user_id" : "session_id", "=", userId || sessionId)
      .execute();

    return response.json({ success: true });
  }
}

export default new CartController();
```

## Payment Integration (Stripe)

### Stripe Service

Create `app/services/Stripe.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

class StripeService {
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true }
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async createRefund(paymentIntentId: string) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId
    });
  }
}

export default new StripeService();
```

### Checkout Controller

Create `app/controllers/shop/CheckoutController.ts`:

```typescript
import { Request, Response } from "../../../type";
import DB from "../../services/DB";
import Stripe from "../../services/Stripe";
import { randomUUID } from "crypto";

class CheckoutController {
  // Show checkout page
  public async index(request: Request, response: Response) {
    const userId = request.user?.id;
    
    if (!userId) {
      return response.redirect("/login");
    }

    // Get cart
    const cartItems = await DB.selectFrom("cart_items")
      .innerJoin("products", "cart_items.product_id", "products.id")
      .select([
        "cart_items.id as cart_id",
        "cart_items.quantity",
        "products.id",
        "products.name",
        "products.price",
        "products.stock"
      ])
      .where("cart_items.user_id", "=", userId)
      .execute();

    if (cartItems.length === 0) {
      return response.redirect("/cart").flash("error", "Your cart is empty");
    }

    const subtotal = cartItems.reduce((sum, item) => 
      sum + item.price * item.quantity, 0
    );
    const shipping = subtotal > 5000 ? 0 : 500; // Free shipping over $50
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + shipping + tax;

    // Create Stripe payment intent
    const paymentIntent = await Stripe.createPaymentIntent(total / 100);

    return response.inertia("shop/checkout", {
      cart: {
        items: cartItems.map(item => ({
          ...item,
          price: item.price / 100
        })),
        subtotal: subtotal / 100,
        shipping: shipping / 100,
        tax: tax / 100,
        total: total / 100
      },
      stripeKey: process.env.STRIPE_PUBLIC_KEY,
      clientSecret: paymentIntent.client_secret
    });
  }

  // Process order
  public async process(request: Request, response: Response) {
    const userId = request.user?.id;
    
    if (!userId) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const { 
      payment_intent_id,
      shipping_address,
      billing_address 
    } = await request.json();

    // Verify payment
    const payment = await Stripe.confirmPayment(payment_intent_id);
    
    if (payment.status !== "succeeded") {
      return response.status(400).json({ error: "Payment failed" });
    }

    // Get cart
    const cartItems = await DB.selectFrom("cart_items")
      .innerJoin("products", "cart_items.product_id", "products.id")
      .select([
        "cart_items.quantity",
        "products.id as product_id",
        "products.name",
        "products.price",
        "products.stock"
      ])
      .where("cart_items.user_id", "=", userId)
      .execute();

    if (cartItems.length === 0) {
      return response.status(400).json({ error: "Cart is empty" });
    }

    // Check stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return response.status(400).json({ 
          error: `Insufficient stock for ${item.name}` 
        });
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => 
      sum + item.price * item.quantity, 0
    );
    const shipping = subtotal > 5000 ? 0 : 500;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order
    const order = await DB.insertInto("orders")
      .values({
        id: randomUUID(),
        order_number: orderNumber,
        user_id: userId,
        status: "processing",
        payment_status: "paid",
        payment_method: "stripe",
        subtotal,
        shipping,
        tax,
        total,
        notes: JSON.stringify({ shipping_address, billing_address }),
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .returningAll()
      .executeTakeFirst();

    // Create order items
    for (const item of cartItems) {
      await DB.insertInto("order_items")
        .values({
          id: randomUUID(),
          order_id: order!.id,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })
        .execute();

      // Update stock
      await DB.updateTable("products")
        .set(eb => ({ stock: eb("stock", "-", item.quantity) }))
        .where("id", "=", item.product_id)
        .execute();
    }

    // Clear cart
    await DB.deleteFrom("cart_items")
      .where("user_id", "=", userId)
      .execute();

    return response.json({ 
      success: true, 
      order: {
        ...order,
        total: order!.total / 100
      }
    });
  }
}

export default new CheckoutController();
```

## Routes Configuration

Add to `routes/web.ts`:

```typescript
import ProductController from "../app/controllers/shop/ProductController";
import CartController from "../app/controllers/shop/CartController";
import CheckoutController from "../app/controllers/shop/CheckoutController";
import Auth from "../app/middlewares/auth";

// Shop routes
Route.get("/shop", ProductController.index);
Route.get("/shop/:slug", ProductController.show);

// Cart routes
Route.get("/cart", CartController.index);
Route.post("/cart/add", CartController.add);
Route.put("/cart/:id", CartController.update);
Route.delete("/cart/:id", CartController.remove);
Route.post("/cart/clear", CartController.clear);

// Checkout routes (require auth)
Route.get("/checkout", [Auth], CheckoutController.index);
Route.post("/checkout/process", [Auth], CheckoutController.process);
```

## AI Prompt Example

To build this e-commerce system using AI:

```
@workflow/INIT_AGENT.md

Create an e-commerce system with these features:
- Product catalog with categories
- Product search and filters (price, category)
- Shopping cart with session persistence
- Checkout flow with Stripe payment
- Order tracking
- Product reviews and ratings
- Inventory management
- Admin dashboard for products
- Responsive design
- Dark mode support
```

Then continue with:

```
@workflow/TASK_AGENT.md

Create the product catalog page with:
- Grid layout for products
- Category sidebar filter
- Price range filter
- Sort options (price, name, newest)
- Search bar
- Product cards with image, name, price
- Add to cart button
- Pagination
```

```
@workflow/TASK_AGENT.md

Create the shopping cart with:
- List of cart items with images
- Quantity adjustment
- Remove item button
- Cart totals calculation
- Clear cart option
- Proceed to checkout button
- Persistent cart across sessions
```

## Next Steps

- Add wishlist functionality
- Implement coupon/discount system
- Add product variants (size, color)
- Create admin dashboard
- Add email notifications
- Implement order tracking
- Add multi-currency support
- Set up inventory alerts
- Create sales reports
- Add product recommendations

## Related

- [Todo Example](./todo) - Simple CRUD patterns
- [Blog Example](./blog) - Content management
- [API Example](./api) - REST API for mobile app
