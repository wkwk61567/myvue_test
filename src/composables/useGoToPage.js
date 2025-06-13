import { useRouter } from "vue-router";

export function useGoToPage(pagePath, selectedRow, keyAudit) {
  const router = useRouter();

  const goToPage = (dannoParam, query = { mode: "view" }) => {
    //跳轉到指定頁面
    // 目前有三種mode: view, add, edit, 對應明細介面的三種模式

    // 檢查是否允許跳轉
    if (query.mode === "edit") {
      // 如果是編輯模式，需要檢查是否已審核
      if (selectedRow.value === null) {
        alert("請選擇一筆資料");
        return;
      }
      if (
        !(
          selectedRow.value[keyAudit] === null ||
          selectedRow.value[keyAudit] === ""
        )
      ) {
        alert("此單已審核，不能修改");
        return;
      }
    }

    // 使用 window.open 開啟新分頁
    const url = router.resolve({
      path: `${pagePath}/${dannoParam}`,
      query: query,
    }).href;
    window.open(url, "_blank");
  };

  return { goToPage };
}
