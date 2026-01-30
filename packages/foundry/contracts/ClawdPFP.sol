// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClawdPFP
 * @notice PFP NFT Collection — mint with ETH, matching CLAWD gets burned from treasury.
 * @dev Admin deposits CLAWD into the contract. When a user mints, the contract
 *      burns a matching amount of CLAWD by sending it to the dead address.
 *      ETH from mints goes to the admin (dev fund).
 */
contract ClawdPFP is ERC721, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The CLAWD token
    IERC20 public immutable clawdToken;

    /// @notice Dead address for burns
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Price to mint one NFT (in wei)
    uint256 public mintPrice;

    /// @notice Amount of CLAWD burned per mint
    uint256 public burnAmountPerMint;

    /// @notice Total number of tokens minted
    uint256 public totalMinted;

    /// @notice Total CLAWD burned across all mints
    uint256 public totalClawdBurned;

    /// @notice Maximum supply (0 = unlimited)
    uint256 public maxSupply;

    /// @notice Whether minting is active
    bool public mintActive;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Per-token URI overrides (for unique PFP art)
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event Minted(address indexed minter, uint256 indexed tokenId, uint256 ethPaid, uint256 clawdBurned);
    event ClawdDeposited(address indexed depositor, uint256 amount);
    event ClawdWithdrawn(address indexed to, uint256 amount);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BurnAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxSupplyUpdated(uint256 oldMax, uint256 newMax);
    event MintActiveUpdated(bool active);
    event BaseURIUpdated(string newBaseURI);
    event TokenURISet(uint256 indexed tokenId, string uri);
    event ETHWithdrawn(address indexed to, uint256 amount);

    constructor(
        address _clawdToken,
        uint256 _mintPrice,
        uint256 _burnAmountPerMint,
        uint256 _maxSupply,
        string memory _initialBaseURI,
        address _owner
    ) ERC721("Clawd PFP", "CPFP") Ownable(_owner) {
        clawdToken = IERC20(_clawdToken);
        mintPrice = _mintPrice;
        burnAmountPerMint = _burnAmountPerMint;
        maxSupply = _maxSupply;
        _baseTokenURI = _initialBaseURI;
        mintActive = true;
    }

    /// @notice Mint an NFT. Sends ETH to admin, burns CLAWD from treasury.
    function mint() external payable {
        require(mintActive, "Minting is not active");
        require(msg.value >= mintPrice, "Insufficient ETH");
        require(maxSupply == 0 || totalMinted < maxSupply, "Max supply reached");

        // Check treasury has enough CLAWD to burn
        uint256 clawdBalance = clawdToken.balanceOf(address(this));
        require(clawdBalance >= burnAmountPerMint, "Insufficient CLAWD treasury");

        // Increment and mint
        totalMinted++;
        uint256 tokenId = totalMinted;
        _safeMint(msg.sender, tokenId);

        // Burn CLAWD from treasury
        if (burnAmountPerMint > 0) {
            clawdToken.safeTransfer(DEAD_ADDRESS, burnAmountPerMint);
            totalClawdBurned += burnAmountPerMint;
        }

        // Refund excess ETH
        if (msg.value > mintPrice) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - mintPrice}("");
            require(refundSuccess, "ETH refund failed");
        }

        emit Minted(msg.sender, tokenId, mintPrice, burnAmountPerMint);
    }

    /// @notice Batch mint multiple NFTs
    /// @param count Number of NFTs to mint
    function mintBatch(uint256 count) external payable {
        require(mintActive, "Minting is not active");
        require(count > 0 && count <= 10, "Mint 1-10 at a time");
        require(msg.value >= mintPrice * count, "Insufficient ETH");
        require(maxSupply == 0 || totalMinted + count <= maxSupply, "Exceeds max supply");

        uint256 totalBurn = burnAmountPerMint * count;
        uint256 clawdBalance = clawdToken.balanceOf(address(this));
        require(clawdBalance >= totalBurn, "Insufficient CLAWD treasury");

        for (uint256 i = 0; i < count; i++) {
            totalMinted++;
            _safeMint(msg.sender, totalMinted);
        }

        // Burn all CLAWD at once
        if (totalBurn > 0) {
            clawdToken.safeTransfer(DEAD_ADDRESS, totalBurn);
            totalClawdBurned += totalBurn;
        }

        // Refund excess ETH
        uint256 totalCost = mintPrice * count;
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(refundSuccess, "ETH refund failed");
        }

        emit Minted(msg.sender, totalMinted, totalCost, totalBurn);
    }

    // ============ Admin Functions ============

    /// @notice Deposit CLAWD into the burn treasury
    /// @dev Caller must approve this contract first
    function depositClawd(uint256 amount) external {
        clawdToken.safeTransferFrom(msg.sender, address(this), amount);
        emit ClawdDeposited(msg.sender, amount);
    }

    /// @notice Withdraw CLAWD from treasury (admin only)
    function withdrawClawd(uint256 amount) external onlyOwner {
        clawdToken.safeTransfer(msg.sender, amount);
        emit ClawdWithdrawn(msg.sender, amount);
    }

    /// @notice Withdraw ETH from contract (admin only)
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH withdrawal failed");
        emit ETHWithdrawn(owner(), balance);
    }

    /// @notice Update mint price
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        emit MintPriceUpdated(mintPrice, _newPrice);
        mintPrice = _newPrice;
    }

    /// @notice Update burn amount per mint
    function setBurnAmountPerMint(uint256 _newAmount) external onlyOwner {
        emit BurnAmountUpdated(burnAmountPerMint, _newAmount);
        burnAmountPerMint = _newAmount;
    }

    /// @notice Update max supply (0 = unlimited)
    function setMaxSupply(uint256 _newMax) external onlyOwner {
        require(_newMax == 0 || _newMax >= totalMinted, "Cannot set below minted");
        emit MaxSupplyUpdated(maxSupply, _newMax);
        maxSupply = _newMax;
    }

    /// @notice Toggle minting on/off
    function setMintActive(bool _active) external onlyOwner {
        mintActive = _active;
        emit MintActiveUpdated(_active);
    }

    /// @notice Set base URI for metadata
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        _baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /// @notice Set individual token URI (overrides base URI)
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        _tokenURIs[tokenId] = uri;
        emit TokenURISet(tokenId, uri);
    }

    /// @notice Batch set token URIs
    function batchSetTokenURIs(uint256[] calldata tokenIds, string[] calldata uris) external onlyOwner {
        require(tokenIds.length == uris.length, "Length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _tokenURIs[tokenIds[i]] = uris[i];
            emit TokenURISet(tokenIds[i], uris[i]);
        }
    }

    // ============ View Functions ============

    /// @notice Get CLAWD treasury balance
    function clawdTreasury() external view returns (uint256) {
        return clawdToken.balanceOf(address(this));
    }

    /// @notice Token URI with per-token override support
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // Check per-token override first
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Fall back to base URI + tokenId
        string memory base = _baseTokenURI;
        if (bytes(base).length > 0) {
            return string(abi.encodePacked(base, _toString(tokenId)));
        }
        
        return "";
    }

    /// @notice Convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint8(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
