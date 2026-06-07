CREATE TABLE IF NOT EXISTS operation_records (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  owner_name VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  metric VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO operation_records (module_name, owner_name, status, metric)
VALUES ('多门店SKU统一管理', '运营组', 'ready', '100%');

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255),
  manager VARCHAR(80),
  phone VARCHAR(40),
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skus (
  id SERIAL PRIMARY KEY,
  sku_code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  spec VARCHAR(120),
  barcode VARCHAR(80),
  category VARCHAR(80),
  unit VARCHAR(20) DEFAULT '件',
  safety_stock INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  sku_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (store_id, sku_id),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (sku_id) REFERENCES skus(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_alerts (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER UNIQUE NOT NULL,
  store_id INTEGER NOT NULL,
  sku_id INTEGER NOT NULL,
  current_qty INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  status VARCHAR(40) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
);

INSERT INTO stores (name, address, manager, phone, status) VALUES
('朝阳门店', '北京市朝阳区朝阳路1号', '张经理', '13800138001', 'active'),
('海淀店', '北京市海淀区中关村大街2号', '李经理', '13800138002', 'active'),
('西城店', '北京市西城区金融街3号', '王经理', '13800138003', 'active'),
('东城店', '北京市东城区王府井4号', '赵经理', '13800138004', 'active'),
('丰台店', '北京市丰台区丰台路5号', '刘经理', '13800138005', 'active');

INSERT INTO skus (sku_code, name, spec, barcode, category, unit, safety_stock) VALUES
('SKU001', '矿泉水', '550ml', '6901234567890', '饮料', '瓶', 50),
('SKU002', '方便面', '桶装', '6901234567891', '食品', '桶', 30),
('SKU003', '牛奶', '250ml', '6901234567892', '饮料', '盒', 40),
('SKU004', '面包', '全麦', '6901234567893', '食品', '个', 20),
('SKU005', '薯片', '原味', '6901234567894', '零食', '袋', 25),
('SKU006', '可乐', '330ml', '6901234567895', '饮料', '罐', 60),
('SKU007', '饼干', '夹心', '6901234567896', '零食', '盒', 15),
('SKU008', '洗衣液', '2kg', '6901234567897', '日用品', '瓶', 10),
('SKU009', '卫生纸', '10卷', '6901234567898', '日用品', '提', 12),
('SKU010', '牙膏', '120g', '6901234567899', '日用品', '支', 18);

INSERT INTO stocks (store_id, sku_id, quantity, updated_at) VALUES
(1, 1, 45, NOW()),
(1, 2, 8, NOW()),
(1, 3, 52, NOW()),
(1, 4, 25, NOW()),
(1, 5, 5, NOW()),
(1, 6, 75, NOW()),
(1, 7, 18, NOW()),
(1, 8, 12, NOW()),
(1, 9, 15, NOW()),
(1, 10, 22, NOW()),
(2, 1, 3, NOW()),
(2, 2, 42, NOW()),
(2, 3, 15, NOW()),
(2, 4, 30, NOW()),
(2, 5, 35, NOW()),
(2, 6, 8, NOW()),
(2, 7, 20, NOW()),
(2, 8, 6, NOW()),
(2, 9, 18, NOW()),
(2, 10, 25, NOW()),
(3, 1, 60, NOW()),
(3, 2, 35, NOW()),
(3, 3, 48, NOW()),
(3, 4, 5, NOW()),
(3, 5, 40, NOW()),
(3, 6, 85, NOW()),
(3, 7, 22, NOW()),
(3, 8, 15, NOW()),
(3, 9, 7, NOW()),
(3, 10, 30, NOW()),
(4, 1, 55, NOW()),
(4, 2, 38, NOW()),
(4, 3, 6, NOW()),
(4, 4, 28, NOW()),
(4, 5, 45, NOW()),
(4, 6, 70, NOW()),
(4, 7, 8, NOW()),
(4, 8, 18, NOW()),
(4, 9, 20, NOW()),
(4, 10, 9, NOW()),
(5, 1, 50, NOW()),
(5, 2, 32, NOW()),
(5, 3, 55, NOW()),
(5, 4, 35, NOW()),
(5, 5, 2, NOW()),
(5, 6, 65, NOW()),
(5, 7, 25, NOW()),
(5, 8, 20, NOW()),
(5, 9, 22, NOW()),
(5, 10, 28, NOW());

INSERT INTO stock_alerts (stock_id, store_id, sku_id, current_qty, threshold, status, created_at) VALUES
(16, 2, 6, 8, 60, 'pending', NOW()),
(11, 2, 1, 3, 50, 'pending', NOW()),
(33, 4, 3, 6, 40, 'pending', NOW()),
(13, 2, 3, 15, 40, 'pending', NOW()),
(45, 5, 5, 2, 25, 'pending', NOW()),
(2, 1, 2, 8, 30, 'pending', NOW()),
(5, 1, 5, 5, 25, 'pending', NOW()),
(24, 3, 4, 5, 20, 'pending', NOW()),
(40, 4, 10, 9, 18, 'pending', NOW()),
(37, 4, 7, 8, 15, 'pending', NOW()),
(1, 1, 1, 45, 50, 'pending', NOW()),
(29, 3, 9, 7, 12, 'pending', NOW()),
(18, 2, 8, 6, 10, 'pending', NOW());
