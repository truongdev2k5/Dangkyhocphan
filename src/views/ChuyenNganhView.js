// src/views/ChuyenNganhView.js

const formatChuyenNganh = (cn) => ({
  ma_chuyen_nganh: cn.ma_chuyen_nganh,
  ten_chuyen_nganh: cn.ten_chuyen_nganh,
});

const formatList = (list) => list.map(formatChuyenNganh);

module.exports = { formatChuyenNganh, formatList };
