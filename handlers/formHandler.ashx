<%@ WebHandler Language="C#" Class="formHandler" %>

using System;
using System.Web;
using System.Collections.Generic;
using System.Diagnostics;
using MySql.Data.MySqlClient;
using Scoreboard2019.Ajax.State;

public class formHandler : IHttpHandler
{

    public void ProcessRequest (HttpContext context)
    {

        //将ajax传来的值存入变量
        String name = context.Request.Params["name"];
        String score = context.Request.Params["score"];
        String round = context.Request.Params["round"];
        String date = DateTime.Now.ToString("MM/dd");
        //确定场次（5/21及5/23属于第一场
        int session = (date.Equals("05/21") || date.Equals("05/23")?0:1);
        context.Response.ContentType = "text/plain";

        //验证分数是否合法
        if (!float.TryParse(score, out float scoreF))
            throw new Exception("[Paramerror]: " + AjaxState.ParamError);
        else
            score = scoreF.ToString();

        //验证轮数是否合法
        if (!int.TryParse(round, out int roundI) || roundI < 1 || roundI > 2)
            throw new Exception("[Paramerror]: " + AjaxState.ParamError);
        else
            round = roundI.ToString();

        //准备查询
        String[] keys = { "name", "session"};
        Boolean existed = false;
        //MySqlDataReader sqlReader = null ;
        MySqlIntegration selectInteg = null;
        String specifier = "name=" + MySqlIntegration.quoteStr(name) + " and session=" + session;
        try
        {
            selectInteg = new MySqlIntegration();
            //执行查询
            existed = selectInteg.mySqlSelect("scores", keys, specifier).Count > 0;
            //sqlReader = selectInteg.mySqlSelect("scores", keys, specifier);
            //定义查询结果集
            //scores = selectInteg.getResult(sqlReader);
        }
        catch(MySqlException e)
        {
            throw e;
        }
        //如果存在同名的行，则将执行update操作
        //System.Diagnostics.Debug.WriteLine(sqlReader.HasRows + ":" + selectInteg.QueryString);
        int recordsAffected;
        if (existed)
        {
            try
            {
                MySqlIntegration updateInteg = new MySqlIntegration();
                String[] updateKeys = { "rd" + round + "_score", "rd" + round + "_time_stamp"};
                //执行更新
                recordsAffected = updateInteg.mysqlUpdate("scores", updateKeys, specifier, score, "NOW()");
            }
            catch(MySqlException e)
            {
                throw e;
            }
        }
        else
        {
            try
            {
                MySqlIntegration insertInteg = new MySqlIntegration();
                String[] insertKeys = { "name", "session", "rd1_score", "rd2_score", "rd" + round + "_time_stamp" };
                //执行插入
                recordsAffected = insertInteg.mysqlInsert("scores", insertKeys,
                    MySqlIntegration.quoteStr(name),
                    session.ToString(),
                    (round.Equals("1")) ? score : "0",
                    (round.Equals("2")) ? score : "0",
                    "NOW()");
            }
            catch (MySqlException e)
            {
                throw e;
            }
        }
        context.Response.Write(recordsAffected);
        //context.Response.Write("Command is executed " + ((sqlReader.RecordsAffected >= 1) ? "successfully " : "unsuccessfully ") + "with " + sqlReader.RecordsAffected + " rows affected");

    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}