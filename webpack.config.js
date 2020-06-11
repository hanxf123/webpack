const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJsWebpackPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const webpack = require('webpack')
const mock = require('./mock')
module.exports = {
  // 通过webpack打包提取公共代码
  optimization: {
    minimizer: [
      // 对js，css的压缩需要在mode=production的模式下才生效
      new UglifyJsWebpackPlugin({
        sourceMap: true, // 是否生成sourceMap文件
        parallel: true, // 是否并行压缩文件
      }),
      new OptimizeCssAssetsWebpackPlugin()
    ]
  },
  watch: true, // 服务器启动后会监听源文件的变化，源文件发生变化时会重新启动编译；监听时只监听入口文件以及入口文件依赖的模块
  watchOptions: {
    poll: 1000, // webpack通过询问源文件变化来重新启动编译，1000代表每秒询问1000次，是目前比较合理的值
    aggregateTimeout: 500, // 累计延迟时间，避免输入时一直编译
    ignored: /node_modules/, // 忽略询问的文件夹
  },
  devtool: 'eval-source-map',
  mode: 'development', // 默认production-生产模式，development-开发模式
  entry:'./src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js'
  },
  devServer: {
    host: '127.0.0.1',
    port: '8080',
    // 配置静态文件根目录
    contentBase: path.resolve('dist'),
    compress: true, // 是否压缩
    proxy: {
      // "/api": "http://localhost:3000"  // 直接代理
      "/api": {
        target: "http://localhost:3000",
        pthRewrite: {  // 重写url，api为前端统一规则，不与后端交互，通过重写去掉
          "^\/api": ""
        }
      }
    },
    // 在请求到静态资源之前配置路由 app=express();
    before(app) {
      // app.get('/user',function(res, res){
      //   res.json({id:1, name:'test'})
      // })
      mock(app);
    },
    // 请求静态资源之后的处理，极少用到
    after(app) {
      app.use(function (err, req, res, next) {
        res.send('请求路径不正确')
      })
    }
  },
  // 填加在其中的文件不会被打包到bundle.js中，能够减小体积，一般是从cdn引入的文件
  /*externals: {
    jquery: "jQuery"
  },*/
  // 配置如何寻找Loader
  /*resolveLoader: {
    modules: ['node_modules','others'], // 后面可以跟自己写的loader模块
  },*/
  // 配置如何寻找普通模块
  /*resolve: {
    // 查找的后缀名，一般情况不要配置太多，避免查找混乱
    extensions: ['js','jsx','json'],
    // 配置路径，引入时可以直接用component
    alias: {
      'component': __dirname+'src/component'
    },
    // 不配置的情况下，也会在node_modules中找，可以添加其他的查找模块,例如还从others里面找
    modules: ['node_modules','others'],
    // mainFields: []
    // 当目录下没有package.json情况下，默认调用index.js,mainFiles可配置调用文件
    mainFiles: ['index']
  },*/
  module: {
    // 配置不需要解析的模块
    noParse: /jquery|lodash/,
    // 配置Loader
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader ,'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|gif|jpg|svg)$/,
        use: {
          loader: "file-loader",
          options: {
            outputPath: 'images', // 指定图片输出路径
            esModule: false // 该配置项为图片打包后的默认路径，带default对象，默认为ture，在配置项里将此项改为false即可去掉多余的defalut对象，否则下面html-withimg-loader html路径会变成{defult：XXXX.png}
          }
        }
      },
      {
        test: /\.html$/,
        use: "html-withimg-loader"
      },
      {
        test: /\.(js|jsx)$/,
        // __dirname指代当前路径
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env'],
            plugins: [['@babel/plugin-proposal-decorators', { "legacy": true }],'@babel/plugin-proposal-class-properties']
          }
        }
      },
      {
        test: /\.(ts|tsx)$/,
        use: ['ts-loader'],
        include: path.resolve('src'),
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html"
    }),
    // 需要将上面的loader中的style-loader改成MiniCssExtractPlugin.loader
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),
    // 公共模块配置，可在项目中直接使用，不需要在每个文件中单独引入一遍。内置插件，不需要安装
    new webpack.ProvidePlugin({
      "_":"lodash"
    }),
    // 添加标签，会在bundle.js顶部注释
    new webpack.BannerPlugin('hxf'),
    // 定义一些希望在代码中直接获取的常量，不用JSON.stringify包裹会报错
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true), // 只能写字符串
      VERSION: JSON.stringify("1.0.0"),
      EXPRESSION: 1+1+1, // 可以放字符串，表达式，boolean值等;表达式
      COPYRIGHT: {
        AUTHOR: JSON.stringify('hxf-test')
      }
    })
  ]
}
