using AutoMapper;
using Azul.Core.TableAggregate.Contracts;

namespace Azul.Api.Models.Output
{
    public class AvailableTablesModel
    {
        public int TablesAvailable => Tables.Count;
        public List<TableModel> Tables { get; set; } = [];

        public void AddTable(TableModel table)
        {
            Tables.Add(table);
        }

        private class MappingProfile : Profile
        {
            public MappingProfile()
            {
                CreateMap<IAvailableTables, AvailableTablesModel>();
            }
        }
    }
}
