// utils.js
import { API_BASE_URL } from "@/config";
import axios from "axios";

export function sleep(ms) {
  // 測試用 可以用await sleep(1000) 來暫停1秒
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function auditOrder(isAudit, params) {
  // 審核(反審核)
  const flagType = isAudit ? "auditflag" : "unauditflag";
  const apiEndpoint = isAudit ? "auditOrder.php" : "unauditOrder.php";
  const actionText = isAudit ? "審核" : "反審核";

  // 檢查權限
  try {
    const hasPermission = await checkFlag(flagType, params.formno);
    if (!hasPermission) {
      alert(`沒有${actionText}權限`);
      return;
    }

    // 確認操作
    if (!confirm(`您確定要${actionText}嗎?`)) {
      return;
    }

    console.log(`${actionText}:`, params.danno);

    const response = await fetch(`${API_BASE_URL}/api/${apiEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log(`${actionText}結果:`, data);
  } catch (error) {
    console.error(`${actionText}失敗`, error);
    alert(`${actionText}操作失敗：${error.message}`);
  }
}

export function handleField(item, field) {
  // 轉換成規範的數字

  let numericValue = parseFloat(item[field]) || 0; // 轉換成數字

  if (numericValue < 0) {
    numericValue = 0; // 如果小於0，則設為0
  }

  numericValue = parseFloat(numericValue.toFixed(4)).toString(); // 四捨五入到小數點後4位

  item[field] = numericValue; // 更新數值
}

export function setCljhditmNumbers(item, limitPercentage) {
  // 用內部的邏輯計算並且重設暫收數量, 暫收重量, 理論單重, 單重差, 金額

  /*
  能再多收幾%定義在xtsetup table下：
  板料（spkindno=3, clkind <> ‘卷料’）：cljhd_blccb
  卷料（spkindno=3, clkind =‘卷料’）：cljhd_jlccb
  輔料（spkindno=[1, 2, 4, 5]）：cljhd_flccb
  */
  console.log("能再多收的百分比:", limitPercentage);
  let itemLimitPercentage = 0;
  if (item.spkindno === "3" && item.clkind === "卷料") {
    itemLimitPercentage = parseFloat(limitPercentage["cljhd_blccb"]);
  } else if (item.spkindno === "3" && item.clkind !== "卷料") {
    itemLimitPercentage = parseFloat(limitPercentage["cljhd_jlccb"]);
  } else if (
    item.spkindno === "1" ||
    item.spkindno === "2" ||
    item.spkindno === "4" ||
    item.spkindno === "5"
  ) {
    itemLimitPercentage = parseFloat(limitPercentage["cljhd_flccb"]);
  } else {
    alert("錯誤! 不支援的供方類別或材料類別");
    return;
  }

  const limitRatio = (100 + itemLimitPercentage) / 100; // 能夠多收的倍數

  // 判斷還能收多少
  const maxjhpcs = parseFloat(
    (
      parseFloat(item["header.cljhditm.dhdpcs"]) * limitRatio -
      parseFloat(item["header.cljhditm.getpcs"])
    ).toFixed(4)
  );
  if (parseFloat(item["header.cljhditm.jhpcs"]) > maxjhpcs) {
    item["header.cljhditm.jhpcs"] = 0; // 如果超過最大值，則設為0
    alert(`僅可再收${maxjhpcs}(只可多收${itemLimitPercentage}%)`);
    console.log("僅可再收", maxjhpcs);
  }

  // 如果!(spkindno===3 && (clkind === '板料' || clkind === '鋁擠型')), jhkg設為jhpcs*dz
  if (
    !(
      item.spkindno === "3" &&
      (item.clkind === "板料" || item.clkind === "鋁擠型")
    )
  ) {
    item["header.cljhditm.jhkg"] = parseFloat(
      (item["header.cljhditm.jhpcs"] * item["header.cljhditm.dz"]).toFixed(4)
    ).toString();
  }

  // 計算單重
  item["header.cljhditm.jhdz"] = parseFloat(
    (item["header.cljhditm.jhkg"] / item["header.cljhditm.jhpcs"]).toFixed(6)
  );

  // 計算單重差
  if (item["header.cljhditm.dz"] === 0) {
    // 避免除以0
    item["header.cljhditm.dzrate"] = 0;
  } else {
    item["header.cljhditm.dzrate"] = parseFloat(
      (
        (item["header.cljhditm.jhdz"] / item["header.cljhditm.dz"] - 1) *
        100
      ).toFixed(2)
    );
  }
  // 只有原材料是以kg為單位計價
  //console.log("spkindname", spkindname);
  if (item.spkindno === "3") {
    item["header.cljhditm.pay"] = parseFloat(
      (item["header.cljhditm.jhkg"] * item["header.cljhditm.price"]).toFixed(2)
    ); // 計算金額
  } else {
    item["header.cljhditm.pay"] = parseFloat(
      (item["header.cljhditm.jhpcs"] * item["header.cljhditm.price"]).toFixed(2)
    ); // 計算金額
  }
}

export async function fetchCategories() {
  // 獲取收貨類別
  try {
    const response = await fetch(`${API_BASE_URL}/api/spkind.php`);
    const data = await response.json();
    const spkindnoOptions = data.map((item) => ({
      spkindno: item.spkindno,
      spkindname: item.spkindname,
    }));
    return spkindnoOptions; // 回傳供方類別選項
  } catch (error) {
    console.error("獲取收貨類別失敗", error);
    return []; // 返回空數組以防錯誤
  }
}

export async function fetchCkkindOptions(spkindname, spkindnoOptions) {
  // 獲取倉庫類別選項
  console.log("供方類別:", spkindname);
  const selectedCategory = spkindnoOptions.find(
    (item) => item.spkindname === spkindname
  );
  const spkindno = selectedCategory ? selectedCategory.spkindno : null;

  console.log("倉庫類別查詢", spkindno);
  const ckkindParams = {
    spkindno: spkindno,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/ckkind.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ckkindParams),
    });
    const data = await response.json();
    console.log("倉庫類別選項查詢結果：", data);
    const ckkindOptions = data.map((item) => ({
      ckkind: item,
    }));
    console.log("test 倉庫類別選項：", ckkindOptions);
    return ckkindOptions; // 回傳倉庫類別選項
  } catch (error) {
    console.error("獲取倉庫類別選項失敗", error);
    return []; // 返回空數組以防錯誤
  }
}

export function filterSuppliers(suppliers, supplyQuery, tempSupplykind) {
  // 根據查詢條件過濾供方列表
  let filteredSuppliers = suppliers; // 初始化過濾列表為所有供方
  if (supplyQuery.trim() !== "") {
    const queryUpper = supplyQuery.toUpperCase(); // 將查詢條件轉換為大寫類別查詢條件轉換為大寫
    filteredSuppliers = suppliers.filter(
      (supplier) =>
        supplier["header.supply.supplyno"].toUpperCase().includes(queryUpper) ||
        supplier["header.supply.supplyname"].toUpperCase().includes(queryUpper)
    );
  }
  if (tempSupplykind.trim() !== "") {
    const tempSupplykindUpper = tempSupplykind.toUpperCase(); // 將供方類別查詢條件轉換為大寫
    filteredSuppliers = filteredSuppliers.filter(
      (supplier) =>
        supplier["header.supply.supplykind"]?.toUpperCase() ===
        tempSupplykindUpper
    );
  }
  return filteredSuppliers; // 回傳過濾後的供方列表
}

export async function cljhdDelete(cljhdDanno, id) {
  // 根據id刪除cljhditm的資料 如果已經沒有了則刪除cljhdmst的整張收貨單

  const params = {
    danno: cljhdDanno,
    id: id,
  };
  console.log("傳送:", params);
  try {
    const response = await fetch(`${API_BASE_URL}/api/cljhdDelete.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (data.error) {
      console.error("刪除失敗:", data.error);
      alert(`刪除失敗: ${data.error}`);
    } else {
      console.log("伺服器回傳內容:", data);
      console.log("刪除完成");
    }
  } catch (error) {
    console.error("刪除資料失敗", error);
    console.log("刪除失敗");
  }
}

export async function checkFlag(requiredFlag, requiredFormno) {
  // 應該改叫isFlagTrue
  // 檢查權限
  try {
    const response = await axios.get(`${API_BASE_URL}/api/checkFlag.php`, {
      withCredentials: true,
      params: {
        flag: requiredFlag,
        formno: requiredFormno,
      },
    });
    const user = response.data;

    if (requiredFlag && user.flag !== 1) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("error", error);
    return false;
  }
}

export async function fetchData(apiFileName, params) {
  // 通用的API請求函數
  console.log(`傳送至:${apiFileName}, 參數:`, params); 
  try {
    const response = await fetch(`${API_BASE_URL}/api/${apiFileName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error(`${apiFileName}失敗:`, error);
    return null;
  }
}

export function calculateColumnSum(results, columnKey) {
  // 計算欄位的加總
  const sum = results.reduce((total, item) => {
    return total + (parseFloat(item[columnKey]) || 0);
  }, 0);
  return parseFloat(sum.toFixed(6)); // 避免浮點數誤差
}

export function getCurrentDateTime() {
  // 獲取當前日期和時間
  const now = new Date(); // 取得當前時間
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份是從0開始的，所以加1
  const day = String(now.getDate()).padStart(2, "0"); // 確保日期是2位數
  const date = `${year}-${month}-${day}`; // 設定日期格式為 yyyy-mm-dd
  const hours = String(now.getHours()).padStart(2, "0"); // 格式化為2位數
  const minutes = String(now.getMinutes()).padStart(2, "0"); // 格式化為2位數
  const time = `${hours}:${minutes}`; // 設定時間
  return [date, time]; // 返回日期和時間
}

export function isFormError(mode, field, value) {
  return (
    mode !== "view" &&
    !(
      field.inputType === "fixed" ||
      (field.inputType === "optional" &&
        !(
          field.componentType === "icon-text-field" ||
          field.componentType === "select"
        ))
    ) &&
    !field.isAllowBlank &&
    (value === "" || value === null)
  );
}