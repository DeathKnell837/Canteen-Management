# Canteen Management - Example Charts

Use these as visual references while building in Lucidchart.

## 1) Example Flowchart (with Input/Output)

```mermaid
flowchart TD
    A([Start]) --> B[/Input Registration or Login Details/]
    B --> C[Validate Account]
    C --> D{New User?}
    D -- Yes --> E[Register Account]
    D -- No --> F[Login Account]
    E --> G[/Output Login Success or Error/]
    F --> G

    G --> H[/Input Search or Filter/]
    H --> I[Display Menu Items]
    I --> J[/Input Add Items and Quantity/]
    J --> K[Add to Cart]
    K --> L[/Input Checkout Request/]
    L --> M[Calculate Subtotal and Tax]
    M --> N{Wallet Balance Enough?}

    N -- No --> O[/Input Top-up Amount/]
    O --> P[Update Wallet Balance]
    P --> M

    N -- Yes --> Q[Create Order PENDING]
    Q --> R[/Input Payment Confirmation/]
    R --> S[Process Payment]
    S --> T{Payment Successful?}

    T -- No --> U[Auto-Cancel Order]
    U --> V[/Output Payment Failed Message/]
    V --> W([End])

    T -- Yes --> X[Update Status to CONFIRMED Paid]
    X --> Y[/Output Order Number and Receipt/]
    Y --> Z[View Order History]
    Z --> W([End])
```

## 2) Example DFD Level 1

```mermaid
flowchart LR
    C[Customer]
    A[Admin Staff]

    P1((1.0 User Authentication))
    P2((2.0 Menu Management))
    P3((3.0 Order Processing))
    P4((4.0 Payment Processing))
    P5((5.0 Order Status Management))
    P6((6.0 Inventory Management))

    D1[(D1 Users)]
    D2[(D2 Menu)]
    D3[(D3 Orders and Order Items)]
    D4[(D4 Payments)]
    D5[(D5 Inventory)]
    D6[(D6 Wallet Transactions)]

    C -->|Registration Login Data| P1
    P1 -->|Auth Result JWT| C
    P1 -->|Create Read User Data| D1
    D1 -->|User Data| P1

    C -->|Search Filter Request| P2
    P2 -->|Menu List Item Details| C
    A -->|Add Edit Delete Menu Data| P2
    P2 -->|Store Update Menu Data| D2
    D2 -->|Menu Data| P2

    C -->|Cart Items Delivery Type| P3
    P3 -->|New Order Record| D3
    P3 -->|Deduct Item Stock| D5
    P3 -->|Order ID Amount| P4

    C -->|Payment Request| P4
    P4 -->|Payment Record| D4
    P4 -->|Deduct Wallet Balance| D1
    P4 -->|Wallet Transaction Log| D6
    P4 -->|Status CONFIRMED| D3

    A -->|Status Action| P5
    P5 -->|Status Update| D3
    P5 -->|Updated Status Receipt Data| C

    A -->|Stock In Stock Out Input| P6
    P6 -->|Inventory Update| D5
    P6 -->|Low Stock Alert| A
```

## 3) Lucidchart Build Tip

When reproducing these in Lucidchart:
- Flowchart symbols:
  - Oval = Start End
  - Rectangle = Process
  - Diamond = Decision
  - Parallelogram = Input Output
- DFD symbols:
  - Rectangle = External Entity
  - Circle = Process
  - Open rectangle = Data Store
  - Arrow label = Data Flow
