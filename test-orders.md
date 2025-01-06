# Order Endpoints Testing Guide

Before running these commands, make sure to:
1. Replace `your-auth-token` with an actual JWT token from login
2. Replace `your-cart-id` with an actual cart ID
3. The server is running on `http://localhost:3000`

## 1. Create Order
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "cartId": "your-cart-id",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "USA",
      "phone": "1234567890"
    },
    "paymentId": "PAY-123456789"
  }'
```

## 2. Get User's Orders
```bash
# Get all orders
curl -X GET http://localhost:3000/api/orders/my-orders \
  -H "Authorization: Bearer your-auth-token"

# Get orders with status filter
curl -X GET "http://localhost:3000/api/orders/my-orders?status=pending" \
  -H "Authorization: Bearer your-auth-token"
```

## 3. Get Order Details
```bash
curl -X GET http://localhost:3000/api/orders/my-orders/your-order-id \
  -H "Authorization: Bearer your-auth-token"
```

## 4. Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/orders/status/your-order-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "status": "processing"
  }'
```

## 5. Cancel Order
```bash
curl -X POST http://localhost:3000/api/orders/cancel/your-order-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "cancelReason": "Changed my mind"
  }'
```

## 6. Get Orders by Date Range
```bash
curl -X GET "http://localhost:3000/api/orders/date-range?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer your-auth-token"
```

## 7. Get Order Statistics
```bash
curl -X GET http://localhost:3000/api/orders/stats \
  -H "Authorization: Bearer your-auth-token"
```

## Testing Flow Example

1. First, create a cart and add items (using cart endpoints)
2. Create an order using the cart
3. Get the order details
4. Update the order status
5. Try to cancel the order (should fail if not pending)
6. Get order statistics

## Error Cases to Test

1. Create order with empty cart:
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "cartId": "empty-cart-id",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "USA",
      "phone": "1234567890"
    },
    "paymentId": "PAY-123456789"
  }'
```

2. Update to invalid status:
```bash
curl -X PATCH http://localhost:3000/api/orders/status/your-order-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "status": "invalid-status"
  }'
```

3. Cancel non-pending order:
```bash
# First update order to processing
curl -X PATCH http://localhost:3000/api/orders/status/your-order-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "status": "processing"
  }'

# Then try to cancel
curl -X POST http://localhost:3000/api/orders/cancel/your-order-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "cancelReason": "Changed my mind"
  }'
```

4. Get orders with invalid date range:
```bash
curl -X GET "http://localhost:3000/api/orders/date-range?startDate=invalid-date&endDate=2025-12-31" \
  -H "Authorization: Bearer your-auth-token"
```

## Response Examples

### Successful Order Creation
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order-id",
    "user": "user-id",
    "items": [...],
    "totalAmount": 100,
    "status": "pending",
    "shippingAddress": {...},
    "payment": {...},
    "createdAt": "2025-01-06T08:00:00.000Z",
    "updatedAt": "2025-01-06T08:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error description"
}
```
