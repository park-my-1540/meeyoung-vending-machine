// ─────────────────────────────
//  타입 및 상태 변수 정의
// ─────────────────────────────
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// 음료 재고 현황
var inventory = {
    cola: { price: 1100, stock: 2 },
    water: { price: 600, stock: 2 },
    coffee: { price: 700, stock: 2 },
};
// 자판기 내부 화폐 재고 (단위별 개수)
var cashStock = {
    10000: 10,
    5000: 10,
    1000: 10,
    500: 10,
    100: 10,
};
// 결제 승인 시 딜레이 시뮬레이션
var CASH_DELAY_MS = 500;
var CARD_DELAY_MS = 1000;
var APPROVE_RATE = 0.8; // 결제 승인 확률
// 사용자의 선택/상태 관리
var userOrders = new Map(); // 사용자가 주문한 음료수
var balance = 0; // 투입된 총 금액
var paymentMethod = null; // 현재 결제 수단
// 결제 유효성 상태
var cashApproved = false; // 현금 사용 가능 여부
var cardApproved = false; // 카드 승인 여부
// 시스템 흐름 제어
var isRefundingChange = false; // 잔돈 반환 중 여부
var cardUsedOnce = false; // 카드 결제 1회 제한 여부
// 로그 출력 위치 식별자
var LogType;
(function (LogType) {
    LogType["DEFAULT"] = "log";
    LogType["CARD"] = "card-log";
    LogType["CASH"] = "cash-log";
})(LogType || (LogType = {}));
// ─────────────────────────────
//  로그 함수
// ─────────────────────────────
/**
 * 지정한 로그 타입 영역에 메시지를 출력한다.
 * @param type - 로그 영역 타입 (DEFAULT, CARD, CASH)
 * @param msg - 출력할 메시지
 */
var logMessage = function (type, msg) {
    var el = document.getElementById(type);
    if (el)
        el.innerHTML = "<p>".concat(msg, "</p>");
};
// 각 로그타입에 대한 단축 함수
var log = function (msg) { return logMessage(LogType.DEFAULT, msg); };
var cardLog = function (msg) { return logMessage(LogType.CARD, msg); };
var cashLog = function (msg) { return logMessage(LogType.CASH, msg); };
/**
 * 카드 및 현금 로그 영역 초기화
 */
var initPaymentLog = function () {
    cardLog("");
    cashLog("");
};
/**
 * 음료 상태에 따른 메시지 출력 (에러가 없으면 기본 안내 문구)
 */
function logDrinkStateMsg(error) {
    if (error) {
        log(error);
    }
    else {
        log("음료를 선택해주세요.");
    }
}
// ─────────────────────────────
//  렌더링 함수
// ─────────────────────────────
/**
 * 현재 잔액을 화면에 표시
 */
function renderBalance() {
    var el = document.getElementById("balance-log");
    if (el)
        el.textContent = "\uC794\uC561: ".concat(balance.toLocaleString("ko-KR"), "\uC6D0");
}
/**
 * 사용자 주문 내역을 화면에 표시
 */
function renderUserOrders() {
    var el = document.getElementById("selected-drink-log");
    var msg = "";
    for (var _i = 0, _a = Array.from(userOrders); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        msg += "<p>".concat(key, " : ").concat(value, "\uAC1C</p>");
    }
    if (el)
        el.innerHTML = msg;
}
/**
 * 자판기 재고 현황을 화면에 표시
 */
function renderInventory() {
    var el = document.getElementById("inventory-log");
    var msg = "";
    for (var _i = 0, _a = Object.entries(inventory); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        msg += "<p>".concat(key, " ").concat(value.stock, "\uAC1C</p>");
    }
    if (el)
        el.innerHTML = msg;
}
/**
 * 자판기 현금 재고 현황을 화면에 표시
 */
function renderCashStock() {
    var el = document.getElementById("cashStock-log");
    var msg = "";
    for (var _i = 0, _a = Object.entries(cashStock); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        msg += "<p>".concat(key, "\uC6D0 ").concat(value, "\uAC1C</p>");
    }
    if (el)
        el.innerHTML = msg;
}
// ─────────────────────────────
//  버튼 / UI 조작 함수
// ─────────────────────────────
/**
 * 현재 상태에 따라 음료 버튼의 활성화 여부를 갱신
 */
function updateDrinkBtnState() {
    var drinks = ["cola", "water", "coffee"];
    drinks.forEach(function (drink) {
        var validStateMsg = isRefundingChange ? null : getValidateStateMsg(drink);
        toggleDrinkBtn(drink, validStateMsg);
        if (!isRefundingChange) {
            logDrinkStateMsg(validStateMsg);
        }
    });
}
/**
 * 음료 선택 활성화/비활성화 상태 변경
 * @param drink - 음료 종류
 * @param validStateMsg - 유효성 검사 결과 메시지 null이면 성공
 */
function toggleDrinkBtn(drink, validStateMsg) {
    var btn = document.querySelector("#".concat(drink));
    if (!btn)
        return;
    if (validStateMsg !== null) {
        btn.classList.add("inactive");
        btn.setAttribute("title", validStateMsg);
    }
    else {
        btn.classList.remove("inactive");
        btn.removeAttribute("title");
    }
}
/**
 * 결제 수단 버튼 비활성화
 * @param method - 결제 수단 (cash, card)
 */
function disableOtherPaymentMethod(method) {
    var _a, _b;
    if (method === "cash") {
        document
            .querySelectorAll("._cardContainer button")
            .forEach(function (btn) { return btn.setAttribute("disabled", "true"); });
        (_a = document.querySelector("#return-change")) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
    }
    else {
        document
            .querySelectorAll("._cashContainer button")
            .forEach(function (btn) { return btn.setAttribute("disabled", "true"); });
        (_b = document.querySelector("#return-change")) === null || _b === void 0 ? void 0 : _b.setAttribute("disabled", "true");
    }
}
/**
 * 결제 수단 버튼 활성화
 */
function enablePaymentBtns() {
    var _a;
    document
        .querySelectorAll("._paymentContainer button")
        .forEach(function (btn) { return btn.removeAttribute("disabled"); });
    (_a = document.querySelector("#return-change")) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
}
// ─────────────────────────────
//  상태 변경 함수
// ─────────────────────────────
/**
 * 잔액 증가
 * @param amount - 증가할 금액
 */
function addToBalance(amount) {
    changeBalance(amount);
}
/**
 * 잔액 감소
 * @param amount - 감소할 금액
 */
function subtractFromBalance(amount) {
    changeBalance(-amount);
}
/**
 * 잔액 변경
 * @param amount - 변경할 금액
 */
function changeBalance(amount) {
    balance += amount;
    renderBalance();
    updateDrinkBtnState();
}
/**
 * 잔액 초기화
 */
function initBalance() {
    balance = 0;
    renderBalance();
    updateDrinkBtnState();
}
/**
 * 음료 재고 감소
 * @param drink - 음료 종류
 */
function decreaseInventory(drink) {
    inventory[drink].stock--;
    renderInventory();
    updateDrinkBtnState();
}
/**
 * 사용자 주문 내역 증가
 * @param drink - 음료 종류
 */
function addToUserOrder(drink) {
    userOrders.set(drink, (userOrders.get(drink) || 0) + 1);
    renderUserOrders();
}
/**
 * 현금 재고 증가
 * @param amount - 증가할 금액
 */
function increaseCashStock(amount) {
    cashStock[amount]++;
    renderCashStock();
}
/**
 * 현금 재고 감소
 * @param change - 감소할 현금 재고
 */
function decreaseCashStock(change) {
    for (var coin in change) {
        cashStock[coin] -= change[coin];
    }
    renderCashStock();
}
// ─────────────────────────────
//  주요 로직 함수
// ─────────────────────────────
/**
 * 잔액 반환
 */
function refundChange() {
    isRefundingChange = true;
    var change = getChangeCombination(balance);
    if (change) {
        decreaseCashStock(change);
    }
    log("\uAC70\uC2A4\uB984\uB3C8 ".concat(balance, "\uC6D0 \uBC18\uD658 \uC644\uB8CC!"));
    initBalance();
    initPaymentMethod();
    isRefundingChange = false;
}
/**
 * 현금 결제
 * @param amount - 결제할 금액
 */
function useCash(amount) {
    return __awaiter(this, void 0, void 0, function () {
        var approved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPaymentMethod("cash");
                    cashLog("지폐 확인 중...");
                    return [4 /*yield*/, validateCash(amount)];
                case 1:
                    approved = _a.sent();
                    if (approved) {
                        successCash(amount);
                    }
                    else {
                        cashLog("사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.");
                        cashApproved = false;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * 현금 결제 성공
 * @param amount - 결제할 금액
 */
function successCash(amount) {
    cashApproved = true;
    processCashReceipt(amount);
    cashLog("사용 가능한 지폐 확인 완료!");
}
/**
 * 현금 결제 처리
 * @param amount - 결제할 금액
 */
function processCashReceipt(amount) {
    addToBalance(amount);
    increaseCashStock(amount);
}
/**
 * 결제 수단 설정
 * @param method - 결제 수단 (cash, card)
 */
function setPaymentMethod(method) {
    paymentMethod = method;
    disableOtherPaymentMethod(method);
}
/**
 * 카드 결제
 * @param amount - 결제할 금액
 */
function useCard() {
    return __awaiter(this, void 0, void 0, function () {
        var approved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPaymentMethod("card");
                    cardLog("결제 승인 중...");
                    return [4 /*yield*/, validateCard()];
                case 1:
                    approved = _a.sent();
                    cardApproved = approved;
                    updateDrinkBtnState();
                    if (approved) {
                        cardLog("결제 승인 성공!");
                    }
                    else {
                        cardLog("결제 승인 실패");
                        init();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * 유저의 선택에 따라 음료 구매 처리
 * @param drink - 음료 종류
 */
function selectDrink(drink) {
    var validateStateMsg = getValidateStateMsg(drink); //null 이면 유효성 통과
    if (validateStateMsg) {
        updateDrinkBtnState();
        return log(validateStateMsg);
    }
    processPayment(drink);
}
/**
 * 결제 처리
 * @param drink - 음료 종류
 */
function processPayment(drink) {
    if (paymentMethod === "cash") {
        subtractFromBalance(inventory[drink].price);
        buyDrink(drink);
    }
    if (paymentMethod === "card") {
        buyDrink(drink);
        log("\uCE74\uB4DC ".concat(inventory[drink].price, "\uC6D0 \uC2B9\uC778 \uC644\uB8CC!"));
        cardOrderEnd();
    }
}
/**
 * 음료 구매
 * @param drink - 음료 종류
 */
function buyDrink(drink) {
    decreaseInventory(drink);
    addToUserOrder(drink);
    log("".concat(drink, " \uAD6C\uB9E4 \uC644\uB8CC!"));
    initPaymentLog();
}
/**
 * 카드 결제 종료
 */
function cardOrderEnd() {
    cardUsedOnce = true;
    initPaymentLog();
    initPaymentMethod();
    updateDrinkBtnState();
    cardUsedOnce = false;
}
// ─────────────────────────────
//  유효성 검사 함수
// ─────────────────────────────
/**
 * 결제 유효성 검사
 * @returns - 유효성 검사 결과 메시지 null이면 성공
 */
function validatePayment() {
    if (!cashApproved && paymentMethod === "cash") {
        return "사용불가능한 지폐입니다. 지폐를 다시 넣어주세요.";
    }
    if (!cardApproved && paymentMethod === "card") {
        return "사용불가능한 카드입니다. 결제수단을 다시 선택해주세요.";
    }
    if (cardUsedOnce) {
        return "주문이 완료되었습니다. 다시 주문하려면 결제 수단을 선택해주세요.";
    }
    if (paymentMethod === null) {
        return "결제수단을 선택해주세요.";
    }
    return null;
}
/**
 * 음료 구매 유효성 검사
 * @param drink - 음료 종류
 * @returns - 유효성 검사 결과 메시지 null이면 성공
 */
function validatePurchase(drink) {
    if (paymentMethod === "cash" && !isEnoughBalance(drink)) {
        return "잔액이 부족합니다.";
    }
    if (!isEnoughStock(drink)) {
        return "재고가 부족합니다.";
    }
    if (paymentMethod === "cash" && !isChangeAvailable(drink)) {
        return "잔돈이 부족하여 해당음료를 구매할 수 없습니다. 다른 음료를 선택해주세요.";
    }
    return null;
}
/**
 * 음료 구매 유효성 검사
 * @param drink - 음료 종류
 * @returns {boolean} - 유효성 검사 결과 메시지 null이면 성공
 */
function getValidateStateMsg(drink) {
    return validatePurchase(drink) || validatePayment();
}
/**
 * 현금 결제 유효성 검사
 * @param amount - 결제할 금액
 * @returns {boolean} - 유효성 검사 결과 메시지
 */
function validateCash(amount) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
        }, CASH_DELAY_MS);
    });
}
/**
 * 카드 결제 유효성 검사
 * @returns {boolean} - 유효성 검사 결과 메시지
 */
function validateCard() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(Math.random() < APPROVE_RATE); //80% 확률로 승인
        }, CARD_DELAY_MS);
    });
}
/**
 * 잔액이 충분한가
 * @param drink - 음료 종류
 * @returns {boolean} - 잔액이 충분한가
 */
function isEnoughBalance(drink) {
    return balance >= inventory[drink].price;
}
/**
 * 재고가 충분한가
 * @param drink - 음료 종류
 * @returns {boolean} - 재고가 충분한가
 */
function isEnoughStock(drink) {
    return inventory[drink].stock > 0;
}
/**
 * 거슬러줄 잔돈이 있는가
 * @param drink - 음료 종류
 * @returns {boolean} - 거슬러줄 잔돈이 있는가
 */
function isChangeAvailable(drink) {
    var changeAmount = balance - inventory[drink].price;
    var change = getChangeCombination(changeAmount);
    return change !== null;
}
/**
 * 잔돈 찾기
 * @param amount - 잔돈 찾기
 * @returns {Record<CashAmount, number> | null} - 잔돈 찾기
 */
function getChangeCombination(amount) {
    var coins = Object.keys(cashStock)
        .map(Number)
        .sort(function (a, b) { return b - a; });
    function dfs(remaining, index, tempInventory, currentChange) {
        var _a;
        if (remaining === 0)
            return currentChange;
        if (index >= coins.length)
            return null; // 동전 다 돌았는데도 남은 금액이 있다면 불가능
        var coin = coins[index];
        var maxCount = Math.min(Math.floor(remaining / coin), tempInventory[coin]);
        for (var i = maxCount; i >= 0; i--) {
            var nextRemaining = remaining - coin * i;
            var nextInventory = __assign(__assign({}, tempInventory), (_a = {}, _a[coin] = tempInventory[coin] - i, _a));
            var nextChange = __assign({}, currentChange);
            if (i > 0)
                nextChange[coin] = i;
            var result = dfs(nextRemaining, index + 1, nextInventory, nextChange);
            if (result)
                return result;
        }
        return null;
    }
    return dfs(amount, 0, __assign({}, cashStock), {});
}
// ─────────────────────────────
//  초기화 + 유틸함수
// ─────────────────────────────
/**
 * 초기화
 */
function init() {
    initBalance();
    initPaymentMethod();
    initUserOrders();
    initInventory();
}
/**
 * 결제 수단 초기화
 */
function initPaymentMethod() {
    paymentMethod = null;
    enablePaymentBtns();
}
/**
 * 사용자 주문 내역 초기화
 */
function initUserOrders() {
    userOrders.clear();
    renderUserOrders();
}
/**
 * 음료 재고 초기화
 */
function initInventory() {
    renderInventory();
    renderCashStock();
}
/**
 * 모든 버튼 디바운스 적용 - 중복 클릭방지
 */
function initEventListeners() {
    document.querySelectorAll("button").forEach(function (btn) {
        var handler = btn.onclick;
        if (handler) {
            btn.onclick = debounce(handler, 300);
        }
    });
}
/**
 * 디바운스
 * @param func - 함수
 * @param delay - 딜레이
 * @returns {Function} - 디바운스 함수
 */
function debounce(func, delay) {
    var _this = this;
    var timer = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(function () {
            func.apply(_this, args);
        }, delay);
    };
}
init();
initEventListeners();
