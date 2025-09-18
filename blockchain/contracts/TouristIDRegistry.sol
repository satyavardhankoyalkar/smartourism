// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title TouristIDRegistry - Non-transferable Tourist Digital ID with safety score and panic signal
/// @notice Issues soulbound IDs to tourists, with role-restricted issuance and updates
contract TouristIDRegistry is ERC721, AccessControl {

    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");
    bytes32 public constant ROLE_ISSUER = keccak256("ROLE_ISSUER");
    bytes32 public constant ROLE_RESPONDER = keccak256("ROLE_RESPONDER");

    struct TouristProfile {
        bytes32 kycHash; // Hash of KYC doc (Aadhaar/passport) stored off-chain
        string itinerary; // Short description or reference ID to itinerary
        string emergencyContact; // Could be phone/email, or reference ID
        string homeCountry;
        uint64 validFrom; // unix seconds
        uint64 validUntil; // unix seconds
        bool optedInTracking; // optional real-time tracking opt-in
        uint8 safetyScore; // 0-100
        bool isPanic; // panic state set by tourist or responder
    }

    uint256 private _nextTokenId = 1;

    // tokenId => profile
    mapping(uint256 => TouristProfile) private _profiles;

    // holder => active tokenId (0 if none)
    mapping(address => uint256) public activeTokenOf;

    event TouristIssued(uint256 indexed tokenId, address indexed to);
    event TouristRevoked(uint256 indexed tokenId, address indexed by);
    event SafetyScoreUpdated(uint256 indexed tokenId, uint8 score, address indexed by);
    event PanicStateSet(uint256 indexed tokenId, bool isPanic, address indexed by);
    event ValidityExtended(uint256 indexed tokenId, uint64 validUntil, address indexed by);
    event TrackingOptInSet(uint256 indexed tokenId, bool optedIn, address indexed by);

    error AlreadyHasActiveId(address holder);
    error NotTokenHolder(address caller);
    error NotActiveOrExpired(uint256 tokenId);
    error InvalidTimeWindow();
    error NonTransferable();

    constructor(address admin, string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ROLE_ADMIN, admin);
    }

    // ------------------------- View helpers -------------------------

    function isActive(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        TouristProfile memory p = _profiles[tokenId];
        return block.timestamp >= p.validFrom && block.timestamp <= p.validUntil;
    }

    function verifyAddressActive(address holder) external view returns (bool) {
        uint256 tokenId = activeTokenOf[holder];
        if (tokenId == 0) return false;
        return isActive(tokenId);
    }

    function getProfile(uint256 tokenId) external view returns (TouristProfile memory) {
        require(_ownerOf(tokenId) != address(0), "Invalid tokenId");
        return _profiles[tokenId];
    }

    function getActiveTokenId(address holder) external view returns (uint256) {
        return activeTokenOf[holder];
    }

    // ------------------------- Issuance & updates -------------------------

    function issueID(
        address to,
        bytes32 kycHash,
        string calldata itinerary,
        string calldata emergencyContact,
        string calldata homeCountry,
        uint64 validFrom,
        uint64 validUntil,
        bool optedInTracking,
        uint8 initialSafetyScore
    ) external onlyRole(ROLE_ISSUER) returns (uint256 tokenId) {
        if (activeTokenOf[to] != 0) revert AlreadyHasActiveId(to);
        if (validUntil <= validFrom || validUntil - validFrom > 365 days) revert InvalidTimeWindow();

        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        _profiles[tokenId] = TouristProfile({
            kycHash: kycHash,
            itinerary: itinerary,
            emergencyContact: emergencyContact,
            homeCountry: homeCountry,
            validFrom: validFrom,
            validUntil: validUntil,
            optedInTracking: optedInTracking,
            safetyScore: initialSafetyScore,
            isPanic: false
        });
        activeTokenOf[to] = tokenId;

        emit TouristIssued(tokenId, to);
    }

    function extendValidity(uint256 tokenId, uint64 newValidUntil) external onlyRole(ROLE_ISSUER) {
        require(_ownerOf(tokenId) != address(0), "Invalid tokenId");
        TouristProfile storage p = _profiles[tokenId];
        if (newValidUntil <= p.validFrom) revert InvalidTimeWindow();
        p.validUntil = newValidUntil;
        emit ValidityExtended(tokenId, newValidUntil, _msgSender());
    }

    function updateSafetyScore(uint256 tokenId, uint8 newScore) external {
        require(_ownerOf(tokenId) != address(0), "Invalid tokenId");
        // Allow issuer and responder roles to adjust score; tourist can also lower via panic or opt-in change indirectly
        if (!hasRole(ROLE_ISSUER, _msgSender()) && !hasRole(ROLE_RESPONDER, _msgSender())) {
            revert("Access denied");
        }
        _profiles[tokenId].safetyScore = newScore;
        emit SafetyScoreUpdated(tokenId, newScore, _msgSender());
    }

    function setTrackingOptIn(uint256 tokenId, bool optedIn) external {
        if (ownerOf(tokenId) != _msgSender() && !hasRole(ROLE_RESPONDER, _msgSender())) revert NotTokenHolder(_msgSender());
        _profiles[tokenId].optedInTracking = optedIn;
        emit TrackingOptInSet(tokenId, optedIn, _msgSender());
    }

    function setPanic(uint256 tokenId, bool isPanic_) external {
        if (ownerOf(tokenId) != _msgSender() && !hasRole(ROLE_RESPONDER, _msgSender())) revert NotTokenHolder(_msgSender());
        _profiles[tokenId].isPanic = isPanic_;
        emit PanicStateSet(tokenId, isPanic_, _msgSender());
    }

    function revokeID(uint256 tokenId) external {
        // Issuer, admin, or token holder can revoke (burn) before/after expiry
        address holder = ownerOf(tokenId);
        if (
            !_hasAnyRole(_msgSender(), ROLE_ADMIN, ROLE_ISSUER) && _msgSender() != holder
        ) revert("Access denied");
        _burn(tokenId);
        if (activeTokenOf[holder] == tokenId) {
            activeTokenOf[holder] = 0;
        }
        delete _profiles[tokenId];
        emit TouristRevoked(tokenId, _msgSender());
    }

    // ------------------------- Soulbound enforcement -------------------------

    function approve(address to, uint256 tokenId) public override {
        to; tokenId;
        revert NonTransferable();
    }

    function setApprovalForAll(address operator, bool approved) public override {
        operator; approved;
        revert NonTransferable();
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        // allow only mint (from address(0)) and burn (to address(0))
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        address previousOwner = super._update(to, tokenId, auth);
        // maintain activeTokenOf mapping on burn
        if (to == address(0) && previousOwner != address(0) && activeTokenOf[previousOwner] == tokenId) {
            activeTokenOf[previousOwner] = 0;
        }
        return previousOwner;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ------------------------- Role management -------------------------

    function grantIssuer(address account) external onlyRole(ROLE_ADMIN) {
        _grantRole(ROLE_ISSUER, account);
    }

    function revokeIssuer(address account) external onlyRole(ROLE_ADMIN) {
        _revokeRole(ROLE_ISSUER, account);
    }

    function grantResponder(address account) external onlyRole(ROLE_ADMIN) {
        _grantRole(ROLE_RESPONDER, account);
    }

    function revokeResponder(address account) external onlyRole(ROLE_ADMIN) {
        _revokeRole(ROLE_RESPONDER, account);
    }

    function _hasAnyRole(address account, bytes32 r1, bytes32 r2) internal view returns (bool) {
        return hasRole(r1, account) || hasRole(r2, account);
    }
}


