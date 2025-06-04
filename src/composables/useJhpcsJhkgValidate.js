// 用來驗證 jhpcs/jhkg 欄位是否已填寫
// 現在改寫成更廣泛的驗證函數useFieldValidate, 這個應該就用不到了

import { reactive, computed, nextTick } from "vue";

export function useJhpcsJhkgValidate(results) {
  const jhpcsRefs = reactive({}); // 用來存儲 jhpcs 欄位的 refs
  const jhkgRefs = reactive({}); // 用來存儲 jhkg 欄位的 refs

  function isJhpcsJhkgValid(item) {
    // 驗證某一行的 jhpcs/jhkg 是否都已填有效值
    const pcs = parseFloat(item["header.cljhditm.jhpcs"]);
    const kg = parseFloat(item["header.cljhditm.jhkg"]);

    if (item["header.cljhditm.dz"] === 0) {
      return !isNaN(pcs) && pcs !== 0; // 特殊處理(允許jhkg為0)
    } else {
      return !isNaN(pcs) && pcs > 0 && !isNaN(kg) && kg > 0;
    }
    /*
    const pcs = item["header.cljhditm.jhpcs"];
    const kg = item["header.cljhditm.jhkg"];
    if (item["header.cljhditm.dz"] === 0) {
      return !isNaN(pcs) && pcs !== 0; // 特殊處理(允許jhkg為0)
    } else {
      return (
        pcs !== "" &&
        pcs !== null &&
        pcs !== undefined &&
        pcs !== 0 &&
        pcs !== "0" &&
        pcs !== "0." &&
        kg !== "" &&
        kg !== null &&
        kg !== undefined &&
        kg !== 0 &&
        kg !== "0" &&
        kg !== "0."
      );
    }
    */
  }

  function handleJhpcsJhkgBlur(item, field) {
    // 當 jhpcs 或 jhkg blur 時檢查，若未填完則 focus 回去
    // field目前沒有用到
    if (!isJhpcsJhkgValid(item)) {
      //alert("請先輸入暫收數量與暫收重量");

      nextTick(() => {
        // 將焦點設置回 jhpcs 或 jhkg
        //console.log("將焦點設置回 jhpcs 或 jhkg");
        /*
        // 可能導致重複失去焦點, 造成handleJhpcsJhkgBlur()不斷被觸發
        if (field === "header.cljhditm.jhpcs") {
          jhpcsRefs[item["header.cljhditm.id"]]?.focus();
        } else if (field === "header.cljhditm.jhkg") {
          jhkgRefs[item["header.cljhditm.id"]]?.focus();
        }
          */

        if (
          !item["header.cljhditm.jhpcs"] ||
          item["header.cljhditm.jhpcs"] === 0 ||
          item["header.cljhditm.jhpcs"] === "0" ||
          item["header.cljhditm.jhpcs"] === "0."
        ) {
          jhpcsRefs[item["header.cljhditm.id"]]?.focus();
        } else {
          jhkgRefs[item["header.cljhditm.id"]]?.focus();
        }
      });
    }
  }
  
  const isOtherFieldDisabled = computed(() => {
    // 應該改叫 isAnyFieldInvalid
    // 只要 jhpcs/jhkg 其中一個沒填好，其他欄位都禁用
    return results.value.some((item) => !isJhpcsJhkgValid(item));
  });

  return {
    jhpcsRefs,
    jhkgRefs,
    isJhpcsJhkgValid,
    handleJhpcsJhkgBlur,
    isOtherFieldDisabled,
  };
}
