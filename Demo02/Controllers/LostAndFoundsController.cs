using Microsoft.AspNetCore.Mvc;
using Demo02.Data.Repositories;
using Demo02.Models;

namespace Demo02.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LostAndFoundsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public LostAndFoundsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // GET: api/LostAndFounds
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LostAndFound>>> GetLostAndFounds()
        {
            return Ok(await _unitOfWork.LostAndFounds.GetAllAsync());
        }

        // POST: api/LostAndFounds
        // UC-12: Khai báo đồ thất lạc
        [HttpPost]
        public async Task<ActionResult<LostAndFound>> PostLostAndFound(LostAndFound item)
        {
            _unitOfWork.LostAndFounds.Add(item);
            await _unitOfWork.CompleteAsync();
            return CreatedAtAction(nameof(GetLostAndFounds), new { id = item.ItemId }, item);
        }
    }
}
