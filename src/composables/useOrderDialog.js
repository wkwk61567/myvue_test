import { ref, reactive, nextTick } from "vue";
import * as utils from "@/utils/utils.js";

export function useOrderDialog(results, idCurrent, focusNextInvalidField) {
  const isCallOrderDialogVisible = ref(false); // 調用訂單介面(CallOrderDialog)是否顯示
  const orderQuery = reactive({ danno: "", spno: "", spspec: "" }); // 用來存儲調用訂單介面(CallOrderDialog)的訂單查詢條件
  const orders = ref([]); // 用來存儲從API獲取的訂單資料 也就是調用訂單介面(CallOrderDialog)裡的訂單列表
  const orderFiltered = ref([]); // 用來存儲過濾後的訂單列表 顯示於調用訂單介面(CallOrderDialog)

  async function openCallOrdersDialog(supplyno) {
    // 打開調用訂單介面(CallOrderDialog)

    // 每次調用訂單對話框打開時，需清空查詢欄位，否則會殘留前次輸入的內容
    orderQuery.danno = "";
    orderQuery.spno = "";
    orderQuery.spspec = "";

    // 調用訂單查詢
    if (!supplyno) {
      console.log("供方編碼為空");
    } else {
      const params = {
        supplyno: supplyno,
      };

      orders.value = await utils.fetchData("callOrder.php", params);
      console.log("調用訂單查詢結果：", orders.value);

      // 轉換成規範的型態
      for (let order of orders.value) {
        order["header.cldhditm.dhdpcs"] = parseInt(
          order["header.cldhditm.dhdpcs"]
        );
        order["header.cldhditm.getpcs"] = parseFloat(
          order["header.cldhditm.getpcs"]
        );
        order["header.NA.notpcs"] = parseFloat(order["header.NA.notpcs"]);
        order["header.cldhditm.jzpcs"] = parseFloat(
          order["header.cldhditm.jzpcs"]
        );
        order["header.cldhditm.price"] = parseFloat(
          order["header.cldhditm.price"]
        );
        order["header.sp.dz"] = parseFloat(order["header.sp.dz"]);
        try {
          order["header.cldhditm.gdate"] =
            order["header.cldhditm.gdate"].date.split(" ")[0];
        } catch (error) {
          // 處理日期格式錯誤的情況
          order["header.cldhditm.gdate"] = null; // 或者設置為其他預設值
          console.error("日期格式錯誤", error);
        }
      }
    }

    orderFiltered.value = orders.value; // 初始化訂單列表
    isCallOrderDialogVisible.value = true; // 打開調用訂單介面
  }

  function handleInputOrderQuery() {
    // 處理調用訂單介面(CallOrderDialog)的查詢條件, 根據查詢條件過濾訂單列表
    if (
      orderQuery["danno"].trim() === "" &&
      orderQuery["spno"].trim() === "" &&
      orderQuery["spspec"].trim() === ""
    ) {
      orderFiltered.value = orders.value;
    } else {
      orderFiltered.value = orders.value.filter(
        (order) =>
          (orderQuery["danno"].trim() === "" ||
            (order["header.cldhditm.danno"] &&
              order["header.cldhditm.danno"]
                .toUpperCase()
                .includes(orderQuery["danno"].toUpperCase()))) &&
          (orderQuery["spno"].trim() === "" ||
            (order["header.cldhditm.spno"] &&
              order["header.cldhditm.spno"]
                .toUpperCase()
                .includes(orderQuery["spno"].toUpperCase()))) &&
          (orderQuery["spspec"].trim() === "" ||
            (order["header.sp.spspec"] &&
              order["header.sp.spspec"]
                .toUpperCase()
                .includes(orderQuery["spspec"].toUpperCase())))
      );
    }
    console.log("orderFiltered:", orderFiltered.value);
  }

  async function selectOrder(order, ddate) {
    // 暫時儲存訂單到下方的表格
    // order是調用訂單中雙擊選中的item

    // 檢查交貨日期
    if (!ddate) {
      alert("收貨日期未設定");
      return;
    }
    const gdate = new Date(order["header.cldhditm.gdate"]);
    const earliestAllowedDate = new Date(gdate);
    earliestAllowedDate.setDate(gdate.getDate() - 3);
    if (new Date(ddate) < earliestAllowedDate) {
      alert("交期未到, 只能提前3天交貨");
      return;
    }

    idCurrent.value += 1;

    // 根據在調用訂單對話框選擇的未結訂單，將相關資訊帶入材料QC一覽表單據頁面下方表格，供輸入暫收數量和暫收重量
    let tempOrder = {};
    tempOrder["header.cljhdmst.supplyno"] = order["header.cldhdmst.supplyno"];
    tempOrder["header.cljhditm.id"] = idCurrent.value;
    tempOrder["header.cljhditm.dhdno"] = order["header.cldhditm.danno"];
    tempOrder["header.cljhditm.dhdid"] = order["header.cldhditm.dhdid"];
    tempOrder["header.cljhditm.spno"] = order["header.cldhditm.spno"];
    tempOrder["header.cljhditm.spspec"] = order["header.sp.spspec"];
    tempOrder["header.cljhditm.spunit"] = order["header.sp.spunit"];
    tempOrder["header.cljhditm.dhdpcs"] = order["header.cldhditm.dhdpcs"];
    tempOrder["header.cljhditm.getpcs"] = order["header.cldhditm.getpcs"];
    tempOrder["header.cljhditm.notpcs"] = order["header.NA.notpcs"];
    tempOrder["header.cljhditm.jhpcs"] = 0;
    tempOrder["header.cljhditm.jhkg"] = 0;
    tempOrder["header.cljhditm.jhdz"] = NaN;
    tempOrder["header.cljhditm.dz"] = order["header.sp.dz"];
    tempOrder["header.cljhditm.dzrate"] = NaN;
    //實收良品數量 pcs
    //實收良品重量 kg
    //實收不良品數量 pcsth
    tempOrder["header.cljhditm.payno"] = order["header.cldhditm.payno"];
    tempOrder["header.cljhditm.price"] = order["header.cldhditm.price"];
    tempOrder["header.cljhditm.pay"] = 0;
    //品檢結果 qcnote
    tempOrder["header.cljhditm.gdate"] = order["header.cldhditm.gdate"];
    tempOrder.isEditCljhditmClicked = true;
    tempOrder.spkindno = order.spkindno;
    tempOrder.clkind = order.clkind;
    console.log("暫存：", tempOrder);
    results.value.push(tempOrder);

    isCallOrderDialogVisible.value = false; // 關閉調用訂單介面

    // 等待DOM更新後，將焦點設置到新添加的行
    await nextTick();
    focusNextInvalidField(tempOrder);
  }

  return {
    isCallOrderDialogVisible,
    orderQuery,
    orderFiltered,
    openCallOrdersDialog,
    handleInputOrderQuery,
    selectOrder,
  };
}
