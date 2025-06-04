import { ref } from "vue";
import * as utils from "@/utils/utils.js";

export function useCheckButtonFlags(formno, audit) {
  const isAddDisabled = ref(true);
  const isEditDisabled = ref(true);
  const isDeleteOrderDisabled = ref(true);
  const isToggleAuditDisabled = ref(true);
  const isExportExcelDisabled = ref(true);

  async function checkButtonFlags() {
    // 檢查按鈕是否禁用
    isAddDisabled.value = !utils.checkFlag("addflag", formno);
    isEditDisabled.value = !utils.checkFlag("editflag", formno);
    isDeleteOrderDisabled.value = !utils.checkFlag("deleteflag", formno);
    if (audit === null || audit === "") {
      isToggleAuditDisabled.value = !utils.checkFlag("auditflag", formno);
    } else {
      isToggleAuditDisabled.value = !utils.checkFlag("unauditflag", formno);
    }
    isExportExcelDisabled.value = !utils.checkFlag("excelflag", formno);
  }

  return {
    isAddDisabled,
    isEditDisabled,
    isDeleteOrderDisabled,
    isToggleAuditDisabled,
    isExportExcelDisabled,
    checkButtonFlags,
  };
}
