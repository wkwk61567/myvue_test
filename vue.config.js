module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("csv")
      .test(/\.csv$/)
      .use("csv-loader")
      .loader("csv-loader")
      .options({
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
        comments: "//", // 加入忽略註解的選項
      });
  },
  /*
  devServer: {
    client: {
      overlay: false, // 嘗試將 overlay 設定移至 client 物件內部
    },
  },
  */
};