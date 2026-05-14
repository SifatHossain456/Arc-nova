// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcNovaStaking — Stake NOVA, earn NOVA rewards
contract ArcNovaStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public novaToken;

    uint256 public rewardRate;          // tokens per second per total staked (scaled 1e18)
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public totalStaked;
    uint256 public constant UNBONDING   = 24 hours;
    uint256 public constant APY_PERCENT = 12; // 12% APY default

    struct UserInfo {
        uint256 staked;
        uint256 rewards;
        uint256 rewardPerTokenPaid;
        uint256 unbondingAmount;
        uint256 unbondingEnd;
    }

    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 availableAt);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _novaToken) Ownable(msg.sender) {
        novaToken      = IERC20(_novaToken);
        lastUpdateTime = block.timestamp;
        // 12% APY: rewardRate = 0.12 / 365 / 86400 * 1e18 ≈ 3805175038051
        rewardRate = 3_805_175_038_051;
    }

    // ── Reward math ────────────────────────────────────────────────────────

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored +
            (rewardRate * (block.timestamp - lastUpdateTime) * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        UserInfo storage u = users[account];
        return (u.staked * (rewardPerToken() - u.rewardPerTokenPaid)) / 1e18 + u.rewards;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime       = block.timestamp;
        if (account != address(0)) {
            users[account].rewards            = earned(account);
            users[account].rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }

    // ── Actions ────────────────────────────────────────────────────────────

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Zero amount");
        novaToken.safeTransferFrom(msg.sender, address(this), amount);
        users[msg.sender].staked += amount;
        totalStaked              += amount;
        emit Staked(msg.sender, amount);
    }

    function requestUnstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(users[msg.sender].staked >= amount, "Insufficient stake");
        users[msg.sender].staked      -= amount;
        totalStaked                   -= amount;
        users[msg.sender].unbondingAmount += amount;
        users[msg.sender].unbondingEnd    =  block.timestamp + UNBONDING;
        emit UnstakeRequested(msg.sender, amount, block.timestamp + UNBONDING);
    }

    function withdraw() external nonReentrant updateReward(msg.sender) {
        UserInfo storage u = users[msg.sender];
        require(u.unbondingAmount > 0, "Nothing unbonding");
        require(block.timestamp >= u.unbondingEnd, "Still unbonding");
        uint256 amount    = u.unbondingAmount;
        u.unbondingAmount = 0;
        novaToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = users[msg.sender].rewards;
        require(reward > 0, "No rewards");
        users[msg.sender].rewards = 0;
        novaToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    // ── Views ──────────────────────────────────────────────────────────────

    function getUserInfo(address account) external view returns (
        uint256 staked,
        uint256 pendingRewards,
        uint256 unbondingAmount,
        uint256 unbondingEnd
    ) {
        UserInfo storage u = users[account];
        return (u.staked, earned(account), u.unbondingAmount, u.unbondingEnd);
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    function fundRewards(uint256 amount) external onlyOwner {
        novaToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function setRewardRate(uint256 _rate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rate;
    }
}
