import { ref } from "vue";
import { API_BASE_URL } from "@/config.js";
import * as utils from "@/utils/utils.js";

export function useSupplyDialog() {
  const dialog = ref(false); // 供方介面(SupplyDialog)是否顯示, 應該改叫openQuerySupplyDialog
  const supplyQuery = ref(""); // 用來存儲供方查詢條件
  const tempSupplykind = ref(""); // 用來存儲供方類別查詢條件
  const suppliers = ref([]); // 用來存儲從API獲取的供方資料
  const filteredSuppliers = ref([]); // 用來存儲過濾後的供方列表

  async function openDialog() {
    // 開啟...的小視窗 應該改叫openQuerySupplyDialog
    supplyQuery.value = ""; // 清空查詢條件
    tempSupplykind.value = ""; // 清空查詢條件

    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 憑證
      });
      const data = await response.json();
      console.log("查詢結果：", data);
      suppliers.value = data;
      filteredSuppliers.value = suppliers.value; // 初始化過濾列表為所有供方
    } catch (error) {
      console.error("查詢失敗", error);
    }

    dialog.value = true; // 顯示小視窗
  }

  function handleInputSupplyQueryAndTempSupplykind() {
    // 處理供方查詢介面的查詢條件
    filteredSuppliers.value = utils.filterSuppliers(
      suppliers.value,
      supplyQuery.value,
      tempSupplykind.value
    ); // 根據查詢條件過濾供方列表
  }
  /*
  // 應該不用寫進來這裡
  const selectSupplier = async (supplier) => {
    // 用戶選擇供方編碼後，將編碼放入供方編碼欄位
    form.supplyno = supplier["header.supply.supplyno"];
    form.supplyname = supplier["header.supply.supplyname"];
    form.spkindname = supplier["header.supply.supplykind"]; // 設定收貨類別為供方類別
    ckkindOptions.value = await utils.fetchCkkindOptions(
      form.spkindname,
      spkindnoOptions.value
    ); // 取得對應的倉庫類別選項
    form.ckkind = ""; // 倉庫類別預設為空
    dialog.value = false; // 關閉小視窗
  };
  */

  return {
    dialog,
    supplyQuery,
    tempSupplykind,
    filteredSuppliers,
    openDialog,
    handleInputSupplyQueryAndTempSupplykind,
  };
}
