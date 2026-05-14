// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcNovaSwap — x*y=k AMM for NOVA/USDC on Arc Testnet
/// @notice The USDC at 0x3600… is a native-token precompile with extcodesize==0.
///         OZ SafeERC20 v5 reverts when extcodesize==0 and returndata is empty,
///         so all outbound USDC transfers use a bare low-level call instead.
contract ArcNovaSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public novaToken;
    IERC20 public usdc;

    uint256 public novaReserve;
    uint256 public usdcReserve;
    uint256 public constant FEE_BPS = 30; // 0.3%

    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, uint256 novaAmount, uint256 usdcAmount);
    event LiquidityRemoved(address indexed provider, uint256 novaAmount, uint256 usdcAmount);

    constructor(address _novaToken, address _usdc) Ownable(msg.sender) {
        novaToken = IERC20(_novaToken);
        usdc      = IERC20(_usdc);
    }

    // ── Internal: USDC transfer via low-level call (bypasses SafeERC20 extcodesize check) ──

    function _sendUsdc(address to, uint256 amount) private {
        (bool ok, bytes memory ret) = address(usdc).call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "USDC send failed");
    }

    // ── Liquidity ──────────────────────────────────────────────────────────

    function addLiquidity(uint256 novaAmount, uint256 usdcAmount) external onlyOwner {
        novaToken.safeTransferFrom(msg.sender, address(this), novaAmount);
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        novaReserve += novaAmount;
        usdcReserve += usdcAmount;
        emit LiquidityAdded(msg.sender, novaAmount, usdcAmount);
    }

    function removeLiquidity(uint256 novaAmount, uint256 usdcAmount) external onlyOwner {
        require(novaReserve >= novaAmount && usdcReserve >= usdcAmount, "Insufficient reserves");
        novaReserve -= novaAmount;
        usdcReserve -= usdcAmount;
        novaToken.safeTransfer(msg.sender, novaAmount);
        _sendUsdc(msg.sender, usdcAmount);
        emit LiquidityRemoved(msg.sender, novaAmount, usdcAmount);
    }

    // ── Pricing ────────────────────────────────────────────────────────────

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        uint256 amountInWithFee = amountIn * (10000 - FEE_BPS);
        return (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
    }

    function getPrice() external view returns (uint256) {
        if (novaReserve == 0) return 0;
        return (usdcReserve * 10**18) / novaReserve;
    }

    function getReserves() external view returns (uint256 nova, uint256 _usdc) {
        return (novaReserve, usdcReserve);
    }

    // ── Swaps ──────────────────────────────────────────────────────────────

    function swapNovaForUsdc(uint256 novaAmountIn, uint256 minUsdcOut) external nonReentrant {
        require(novaAmountIn > 0, "Zero amount");
        uint256 usdcOut = getAmountOut(novaAmountIn, novaReserve, usdcReserve);
        require(usdcOut >= minUsdcOut, "Slippage too high");

        novaToken.safeTransferFrom(msg.sender, address(this), novaAmountIn);
        novaReserve += novaAmountIn;
        usdcReserve -= usdcOut;

        _sendUsdc(msg.sender, usdcOut); // low-level call — safe on precompile

        emit Swap(msg.sender, address(novaToken), novaAmountIn, usdcOut);
    }

    function swapUsdcForNova(uint256 usdcAmountIn, uint256 minNovaOut) external nonReentrant {
        require(usdcAmountIn > 0, "Zero amount");
        uint256 novaOut = getAmountOut(usdcAmountIn, usdcReserve, novaReserve);
        require(novaOut >= minNovaOut, "Slippage too high");

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmountIn);
        usdcReserve += usdcAmountIn;
        novaReserve -= novaOut;
        novaToken.safeTransfer(msg.sender, novaOut);

        emit Swap(msg.sender, address(usdc), usdcAmountIn, novaOut);
    }
}
