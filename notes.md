## Take Home Assessment Notes

what does a nest have?
- inventory (med supplies)
- operators
  - manage inventory
  - process orders

what to build?
- inventory management & order processing system
  1. manages inventory
  2. tracks items in stock
  3. processes orders -> shipments


- FIRST calls `init_catalog(product_info)`
  - catalog
    - catalog_id
    - product_id
  - init to 0 of each product in inventory
  - product_info: array of products to be stocked/ordered (catalog)
  - product: represents a medical supply in the catelog, and an object w following fields
    - mass_g (num) mass of the product in grams
    - product_name (str) name of the product in the catalog
    - product_id (num) unique identifier of the product
    
- SECOND receives inputs via one of these APIs:
  1. `process_order(order)`
    - puts new order in system
    - order: represents incoming order from a hospital, and an object w following fields
      - order_id (num) unique identifier of the order
      - requested (arr) list of requested products. a request obj has:
        - product_id (num) id of requested product
        - quantity (num) how many of certain product is requested
    - limitations
      - order too big (max size = 1.8kg)
      - no more stock of requested product -> partially process order -> `process_restock` -> `ship_package` (if there's enough)
  2. `process_restock(restock)`
    - adds products to the inventory
    - restock - represents products to be restocked in the inventory, an arr with restock objects of following fields:
      - product_id (num) id of product to be restocked
      - quantity (num) how many of the product to be restocked
- THIRD `ship_package(shipment)`
  - prints out the shipment
  - shipment - the order to be shipped


things to consider
- num of requested products exceeds what's in inventory
  - partially fulfill order
- product id doesn't exist (when trying to process order or restock a product)
- ship package limitations
- order id doesn't exist (when trying to ship)
