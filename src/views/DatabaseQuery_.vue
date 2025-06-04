<!-- filepath: /C:/Users/Ader/Documents/vue/src/views/DatabaseQuery.vue -->
<template>
  <v-container>
    <!-- 語言選擇器 -->
    <v-row>
      <v-col cols="12" class="text-right">
        <v-select
          v-model="selectedLanguage"
          :items="languageOptions"
          item-text="title"
          item-value="key"
          label="選擇語言"
          outlined
        ></v-select>
      </v-col>
    </v-row>

    <!-- 搜尋表單區塊 -->
    <v-card>
      <v-card-title>材料QC一覽表</v-card-title>
      <v-card-text>
        <v-row>
          <!-- 日期範圍 -->
          <v-col cols="6">
            <v-text-field
              v-model="dDateStart"
              label="起始日期"
              type="date"
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="dDateEnd"
              label="結束日期"
              type="date"
              outlined
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <!-- 收貨單號 -->
          <v-col cols="6">
            <v-text-field
              v-model="cljhdDanno"
              label="收貨單號"
              outlined
            ></v-text-field>
          </v-col>

          <!-- 原始單號 -->
          <v-col cols="6">
            <v-text-field
              v-model="dannobase"
              label="原始單號"
              outlined
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <!-- 收貨類別 -->
          <v-col cols="6">
            <v-select
              v-model="spkindname"
              :items="categoryOptionsWithEmpty"
              item-title="spkindname"
              item-value="spkindname"
              label="收貨類別"
              outlined
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-right">
            <v-btn color="primary" @click="fetchData">查詢</v-btn>
            <v-btn color="secondary" @click="resetFilters" class="ml-2"
              >清除</v-btn
            >
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
    <v-card class="mt-4">
      <v-card-title>查詢結果</v-card-title>
      <v-data-table
        :headers="headers"
        :items="results"
        class="elevation-1"
        :no-data-text="loadingMessage"
        :items-per-page="25"
        style="max-height: 1200px; overflow-y: auto"
      >
        <template v-slot:header="{ headers }">
          <thead>
            <tr>
              <th v-for="header in headers" :key="header.key">
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

        <template v-slot:item="{ item }">
          <tr @click="goToDetailsPage(item['cljhdmst.danno'])">
            <td>{{ item["cljhdmst.ddate"] }}</td>
            <td>{{ item["cljhdmst.danno"] }}</td>
            <td>{{ item["cljhdmst.dannobase"] }}</td>
            <td>{{ item["cljhdmst.pjdno"] }}</td>
            <td>{{ item["cljhdmst.supplyno"] }}</td>
            <td>{{ item["cljhdmst.supplyname"] }}</td>
            <td>{{ item["cljhdmst.yjdno"] }}</td>
            <td>{{ item["cljhdmst.qcnot"] }}</td>
            <td>{{ item["cljhdmst.demo"] }}</td>
            <td>{{ item["cljhdmst.maker"] }}</td>
            <td>{{ item["cljhdmst.audit"] }}</td>
            <td>{{ item["cljhdmst.dtime"] }}</td>
            <td>{{ item["cljhdmst.auditdtime"] }}</td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import { API_BASE_URL } from "@/config";
import { loadDictionary } from "@/i18n/loadDictionary.js"; // CSV 解析檔案

export default {
  data() {
    return {
      // 查詢條件
      dDateStart: "",
      dDateEnd: "",
      cljhdDanno: "",
      dannobase: "",
      spkindname: null, // 收貨類別，預設空字串
      categoryOptions: [],
      selectedLanguage: "zh-TW", // 預設語言 ！應該要拉到config檔
      languageOptions: [
        // ！應該要拉到config檔
        { title: "繁體中文", key: "zh-TW" },
        { title: "English", key: "en" },
        { title: "Tiếng Việt", key: "vi" },
      ],

      // 查詢結果資料
      results: [],
      headers: [],
      // 由 CSV 載進來的完整字典
      fullDictionary: {},
      loading: false,
      loadingMessage: "No data available",
      loadingInterval: null,
      loadingSeconds: 0,
    };
  },
  // ！這個computed及下面的function和return內官如何理解?
  computed: {
    // 收貨類別加入空白即「不設限」選項
    categoryOptionsWithEmpty() {
      return [{ spkindno: "", spkindname: null }, ...this.categoryOptions];
    },
  },
  methods: {
    // 讀取 CSV 字典，應該移到config檔？
    async initDictionary() {
      try {
        this.fullDictionary = await loadDictionary();
      } catch (error) {
        console.error("載入字典失敗:", error);
      }
    },
    setHeaders() {
      // Check if the dictionary for this Vue file exists
      if (!this.fullDictionary["DatabaseQuery.vue"]) {
        this.headers = [];
        return;
      }

      // Define column prefixes with their tables
      const columns = [
        { table: "cljhdmst", column: "ddate" },
        { table: "cljhdmst", column: "danno" },
        { table: "cljhdmst", column: "dannobase" },
        { table: "cljhdmst", column: "pjdno" },
        { table: "cljhdmst", column: "supplyno" },
        { table: "cljhdmst", column: "supplyname" },
        { table: "cljhdmst", column: "yjdno" },
        { table: "cljhdmst", column: "qcnot" },
        { table: "cljhdmst", column: "demo" },
        { table: "cljhdmst", column: "maker" },
        { table: "cljhdmst", column: "audit" },
        { table: "cljhdmst", column: "dtime" },
        { table: "cljhdmst", column: "auditdtime" },
      ];

      this.headers = columns.map(({ table, column }) => {
        // Properly navigate the nested dictionary structure
        const translation =
          this.fullDictionary["DatabaseQuery.vue"]?.[table]?.[column]?.[
            this.selectedLanguage
          ] || column;

        // Use just the column name for data binding
        return { title: translation, key: `${table}.${column}` };
      });
    },
    async fetchCategories() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/spkind.php`);
        const data = await response.json();
        this.categoryOptions = data.map((item) => ({
          spkindno: item.spkindno,
          spkindname: item.spkindname,
        }));
      } catch (error) {
        console.error("獲取收貨類別失敗", error);
      }
    },
    async fetchData() {
      this.loading = true;
      this.loadingSeconds = 0;
      this.updateLoadingMessage();
      this.loadingInterval = setInterval(this.updateLoadingMessage, 1000);

      const queryParams = {
        dDateStart: this.dDateStart,
        dDateEnd: this.dDateEnd,
        cljhdDanno: this.cljhdDanno,
        dannobase: this.dannobase,
        spkindname: this.spkindname,
      };

      console.log("查詢條件：", queryParams);

      try {
        const response = await fetch(`${API_BASE_URL}/api/cljhd_.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryParams),
        });

        const responseData = await response.json();
        console.log("查詢結果：", responseData);

        // Check if responseData has data property (new structure) or is the data itself (old structure)
        const data = responseData.data || responseData;
        this.results = data;

        // Log debug timing if available
        if (responseData.debug) {
          console.log("Debug timing (seconds):", {
            連線與查詢時間: responseData.debug.queryTime.toFixed(3),
            資料獲取時間: responseData.debug.fetchTime.toFixed(3),
            總處理時間: responseData.debug.totalTime.toFixed(3),
          });
        }
      } catch (error) {
        console.error("查詢失敗", error);
      } finally {
        this.loading = false;
        clearInterval(this.loadingInterval);
      }
    },
    resetFilters() {
      this.dDateStart = "";
      this.dDateEnd = "";
      this.cljhdDanno = "";
      this.dannobase = "";
      this.spkindname = null;
      this.results = [];
    },
    goToDetailsPage(danno) {
      const url = this.$router.resolve({
        name: "Details",
        params: { danno },
      }).href;
      window.open(url, "_blank");
    },
    updateLoadingMessage() {
      this.loadingSeconds++;
      const dots = ".".repeat(this.loadingSeconds % 4);
      this.loadingMessage = `目前正在等候API回覆${dots} (${this.loadingSeconds}s)`;
    },
  },
  async mounted() {
    await this.initDictionary(); // 先載入字典
    this.setHeaders(); // 根據字典設定表頭
    await this.fetchCategories();
  },
  watch: {
    selectedLanguage: {
      handler() {
        this.setHeaders();
      },
    },
  },
};
</script>

<style scoped>
.v-card {
  padding: 16px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
