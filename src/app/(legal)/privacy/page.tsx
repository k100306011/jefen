import type { Metadata } from "next";
import {
  SITE_NAME,
  OPERATOR_NAME,
  CONTACT_EMAIL,
  LEGAL_UPDATED_AT,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "隱私權政策",
  description: `${SITE_NAME} 如何蒐集、使用與保護你的個人資料，以及你對自己資料擁有的權利。`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `隱私權政策 · ${SITE_NAME}`,
    description: `${SITE_NAME} 如何蒐集、使用與保護你的個人資料。`,
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <h1
        className="text-2xl font-bold"
        style={{ color: "#2C2926", letterSpacing: "-0.02em" }}
      >
        隱私權政策
      </h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "#9C8E7E" }}>
        最後更新：{LEGAL_UPDATED_AT}
      </p>

      <p>
        歡迎使用「{SITE_NAME}」（以下稱「本服務」）。我們（{OPERATOR_NAME}
        ，以下稱「我們」）非常重視你的隱私。本政策說明我們蒐集哪些資料、如何使用與保護，以及你可以如何管理自己的資料。
        <strong>當你使用本服務，即表示你已閱讀並同意本政策。</strong>
      </p>

      <h2>一、我們蒐集的資料</h2>
      <h3>1. 你透過登入提供的資料</h3>
      <ul>
        <li>
          以 Google 帳號登入時，我們會取得你的<strong>姓名、電子郵件與大頭貼</strong>
          ，用於建立你的帳號與辨識身分。
        </li>
      </ul>
      <h3>2. 你主動提供的資料</h3>
      <ul>
        <li>
          <strong>你上傳的照片</strong>（最多兩張：主照片與對比照）及其標籤（例如「剪髮後」）。
        </li>
        <li>
          <strong>分眾屬性</strong>：性別、年齡區間、所在地區，用於計算你在不同族群眼中的分眾結果。
        </li>
        <li>
          <strong>年齡聲明</strong>：你確認自己已滿 18 歲。
        </li>
      </ul>
      <h3>3. 你使用過程產生的資料</h3>
      <ul>
        <li>
          你對他人照片給出的<strong>評分紀錄</strong>；系統會在你評分當下，保存你當時分眾屬性的
          <strong>快照</strong>（不含身分），供日後聚合計算，即使你之後修改個人資料也不影響歷史結果。
        </li>
      </ul>
      <h3>4. 自動蒐集的技術資料</h3>
      <ul>
        <li>
          維持登入狀態所需的<strong>工作階段（session）資訊</strong>，以及基本的存取與錯誤紀錄（供資訊安全、防止濫用與除錯之用）。
        </li>
      </ul>

      <h2>二、我們如何使用你的資料</h2>
      <ul>
        <li>提供核心玩法：將照片配對給其他使用者評分，並為你聚合出分眾定位與百分位。</li>
        <li>內容審核：以自動化方式檢查上傳照片是否適當（見下方第三點）。</li>
        <li>維護帳號安全、防止洗分與濫用、進行系統除錯與改善。</li>
        <li>在你要求時，回應你對個人資料的查閱、更正或刪除。</li>
      </ul>
      <p>
        我們<strong>不會</strong>將你的照片用於人臉身分辨識、廣告鎖定，也<strong>不會販售</strong>你的個人資料。
      </p>

      <h2>三、照片與 AI 內容審核</h2>
      <p>
        為了維持社群安全，你上傳的照片會經過<strong>自動化內容審核</strong>，用於判斷是否含有不適當內容（例如裸露、暴力或非本人人像）。此審核可能透過第三方 AI 服務（例如
        Google Gemini）進行，僅用於判定內容是否適當，不會用於辨識你的身分。
      </p>

      <h2>四、聚合與匿名保護</h2>
      <ul>
        <li>
          你<strong>永遠看不到「哪一位使用者」給你打了幾分</strong>。所有結果只以群體聚合的形式呈現。
        </li>
        <li>
          每張照片需累積達到<strong>最低評分樣本數</strong>後，才會生成結果，以避免任何單一評分被反推。
        </li>
        <li>
          各分眾小組（例如「台北」「18–24 歲」）也各自有<strong>最低樣本數門檻</strong>
          ，樣本不足的小組不會顯示，避免從小組分數推算出某個特定使用者給的分數。
        </li>
      </ul>

      <h2>五、我們如何分享資料</h2>
      <p>我們僅在以下情況與第三方分享必要資料：</p>
      <ul>
        <li>
          <strong>服務供應商</strong>：協助我們營運的必要服務，例如 Google（帳號登入）、AI 內容審核服務（照片審核）。
        </li>
        <li>
          <strong>法律要求</strong>：當法律、法院或主管機關依法要求時，我們會在必要範圍內配合。
        </li>
      </ul>
      <p>
        除上述情形外，我們<strong>不會</strong>將你的個人資料出售、出租或提供給第三方作行銷用途。
      </p>

      <h2>六、Cookie 與追蹤</h2>
      <p>
        本服務僅使用維持你登入狀態所<strong>必要的 Cookie</strong>，不使用第三方廣告追蹤或跨站分析。
      </p>

      <h2>七、資料保存與刪除</h2>
      <ul>
        <li>你的資料會保存至你刪除為止。</li>
        <li>
          你可以隨時在<strong>我的照片</strong>頁面刪除單張照片，或在<strong>設定</strong>頁面
          <strong>刪除整個帳號</strong>。
        </li>
        <li>
          刪除帳號會移除你的個人資料、照片及與你關聯的評分紀錄。請注意，<strong>已完成聚合且去識別化的統計結果</strong>
          （不含任何可辨識個人的資訊）可能仍會保留。
        </li>
      </ul>

      <h2>八、資料安全</h2>
      <p>
        我們透過 HTTPS 加密傳輸、存取控管等合理措施保護你的資料。但請理解，沒有任何網路傳輸或儲存能保證絕對安全。
      </p>

      <h2>九、年齡限制</h2>
      <p>
        本服務<strong>僅限年滿 18 歲</strong>者使用，且不刻意向未成年人蒐集資料。若我們得知有未滿
        18 歲者使用，將刪除其帳號與相關資料。
      </p>

      <h2>十、資料存放地點</h2>
      <p>
        你的資料主要儲存於我們營運的伺服器。部分服務供應商（如 Google）可能於境外處理相關資料。
      </p>

      <h2>十一、你的權利</h2>
      <p>
        你有權查閱、更正、刪除你的個人資料，或撤回先前的同意。多數操作可直接在服務內完成；如需協助，歡迎透過下方信箱與我們聯繫。
      </p>

      <h2>十二、政策變更</h2>
      <p>
        我們可能因功能調整或法規要求更新本政策。重大變更時會於本頁更新「最後更新」日期；持續使用本服務即視為同意更新後的內容。
      </p>

      <h2>十三、聯絡我們</h2>
      <p>
        對本政策或你的個人資料有任何疑問，歡迎聯絡：
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
